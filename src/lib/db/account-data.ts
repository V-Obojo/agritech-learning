import "server-only";
import { randomUUID } from "node:crypto";
import { asc,eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./index";
import { events,guideHistory,progress,users } from "./schema";
import { defaultProgress,mergeProgress,progressSchema,type Progress } from "../progress";
import { eventSchema,type MetricEvent } from "../metrics";
import { resolveTopic } from "../content";
import { HttpError } from "../auth/http";

export async function getAccountProgress(userId:string) {
  const [row]=await (await getDb()).select({data:progress.data}).from(progress).where(eq(progress.userId,userId));
  return progressSchema.parse(row?.data ?? defaultProgress());
}
export async function putAccountProgress(userId:string,data:Progress,merge=false) {
  const db=await getDb(),at=new Date().toISOString();
  return db.transaction(async tx=>{
    const [row]=await tx.select({data:progress.data}).from(progress).where(eq(progress.userId,userId));
    const next=merge ? mergeProgress(data,progressSchema.parse(row?.data ?? defaultProgress())) : progressSchema.parse(data);
    await tx.insert(progress).values({userId,data:next,updatedAt:at}).onConflictDoUpdate({target:progress.userId,set:{data:next,updatedAt:at}});
    await tx.update(users).set({intention:next.intention,updatedAt:at}).where(eq(users.id,userId));
    return next;
  });
}
export async function getAccountEvents(userId:string):Promise<MetricEvent[]> {
  const rows=await (await getDb()).select({name:events.name,at:events.createdAt,details:events.details}).from(events).where(eq(events.userId,userId)).orderBy(asc(events.createdAt));
  return rows.flatMap(row=>{const parsed=eventSchema.safeParse(row);return parsed.success ? [parsed.data] : [];});
}
export async function addAccountEvents(userId:string,items:MetricEvent[]) {
  if(!items.length) return;
  await (await getDb()).insert(events).values(items.map(item=>({id:randomUUID(),userId,name:item.name,createdAt:item.at,details:item.details}))).onConflictDoNothing();
}
export const guideHistorySchema=z.object({
  subjectId:z.string().min(1).max(100),topicId:z.string().min(1).max(100),question:z.string().trim().min(1).max(500),answer:z.string().trim().min(1).max(10000),supported:z.boolean(),
  citations:z.array(z.object({chunkId:z.string().min(1).max(100),title:z.string().min(1).max(300)}).strict()).max(30),
}).strict();
export async function addGuideHistory(userId:string,value:z.infer<typeof guideHistorySchema>) {
  const data=guideHistorySchema.parse(value);
  let topic;
  try {topic=resolveTopic(data);} catch {throw new HttpError(400,"Choose an available topic.");}
  if(data.citations.some(citation=>!topic.lesson.chunks.some(chunk=>chunk.id===citation.chunkId)) || (!data.supported && data.citations.length)) throw new HttpError(400,"Citations must belong to this topic.");
  await (await getDb()).insert(guideHistory).values({id:randomUUID(),userId,...data,createdAt:new Date().toISOString()});
}
