import "server-only";
import { and,desc,eq,gte } from "drizzle-orm";
import { getDb } from "../db";
import { dashboardPrefs,events,guideHistory,users } from "../db/schema";
import { eventSchema } from "../metrics";
import { getAccountProgress } from "../db/account-data";
import { defaultLayout,layoutSchema,type WidgetLayout } from "./layout";
export async function getDashboardLayout(userId:string) {
  const [row]=await (await getDb()).select({widgets:dashboardPrefs.widgets}).from(dashboardPrefs).where(eq(dashboardPrefs.userId,userId));
  const parsed=layoutSchema.safeParse(row?.widgets);return parsed.success ? parsed.data : defaultLayout();
}
export async function saveDashboardLayout(userId:string,widgets:WidgetLayout) {
  widgets=layoutSchema.parse(widgets);const updatedAt=new Date().toISOString();
  await (await getDb()).insert(dashboardPrefs).values({userId,widgets,updatedAt}).onConflictDoUpdate({target:dashboardPrefs.userId,set:{widgets,updatedAt}});
}
export async function getDashboardData(userId:string,now:Date) {
  const db=await getDb();
  const [progress,rows,history,layout,profiles]=await Promise.all([
    getAccountProgress(userId),db.select().from(events).where(and(eq(events.userId,userId),gte(events.createdAt,new Date(now.getTime()-90*86400000).toISOString()))).orderBy(events.createdAt),
    db.select({id:guideHistory.id,subjectId:guideHistory.subjectId,topicId:guideHistory.topicId,question:guideHistory.question,answer:guideHistory.answer,supported:guideHistory.supported,citations:guideHistory.citations,createdAt:guideHistory.createdAt}).from(guideHistory).where(eq(guideHistory.userId,userId)).orderBy(desc(guideHistory.createdAt)).limit(20),
    getDashboardLayout(userId),db.select({createdAt:users.createdAt}).from(users).where(eq(users.id,userId)),
  ]);
  return {progress,events:rows.flatMap(row=>{const result=eventSchema.safeParse({name:row.name,at:row.createdAt,details:row.details});return result.success ? [result.data] : [];}),history,layout,memberSince:profiles[0]?.createdAt ?? now.toISOString()};
}
