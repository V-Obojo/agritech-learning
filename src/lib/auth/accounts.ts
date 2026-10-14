import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "../db";
import { users,progress as progressTable } from "../db/schema";
import { defaultProgress,progressSchema } from "../progress";
import { getCatalog } from "../content";
import { HttpError } from "./http";
import { hashPassword,verifyPassword } from "./password";
import { signupSchema,profileSchema,changePasswordSchema } from "./validation";

function validIntention(intention:string|null|undefined) {
  if(intention && !getCatalog().intentions.some(item=>item.id===intention)) throw new HttpError(400,"Choose an available intention.");
}
export async function createAccount(value:z.infer<typeof signupSchema>) {
  const data=signupSchema.parse(value);validIntention(data.intention);
  const passwordHash=await hashPassword(data.password),id=randomUUID(),at=new Date().toISOString();
  const db=await getDb();
  return db.transaction(async tx=>{
    const inserted=await tx.insert(users).values({id,email:data.email,name:data.name,passwordHash,state:data.state ?? null,intention:data.intention ?? null,createdAt:at,updatedAt:at}).onConflictDoNothing({target:users.email}).returning({id:users.id});
    if(!inserted.length) throw new HttpError(409,"Unable to create an account with those details.");
    await tx.insert(progressTable).values({userId:id,data:{...defaultProgress(),intention:data.intention ?? null},updatedAt:at});
    return id;
  });
}
export async function updateProfile(userId:string,value:z.infer<typeof profileSchema>) {
  const data=profileSchema.parse(value);validIntention(data.intention);
  const db=await getDb(),at=new Date().toISOString();
  await db.transaction(async tx=>{
    await tx.update(users).set({...data,state:data.state ?? null,intention:data.intention ?? null,updatedAt:at}).where(eq(users.id,userId));
    const [record]=await tx.select().from(progressTable).where(eq(progressTable.userId,userId));
    const next={...progressSchema.parse(record?.data ?? defaultProgress()),intention:data.intention ?? null,updatedAt:at};
    await tx.insert(progressTable).values({userId,data:next,updatedAt:at}).onConflictDoUpdate({target:progressTable.userId,set:{data:next,updatedAt:at}});
  });
}
export async function changePassword(userId:string,value:z.infer<typeof changePasswordSchema>) {
  const data=changePasswordSchema.parse(value),db=await getDb();
  const [user]=await db.select({passwordHash:users.passwordHash}).from(users).where(eq(users.id,userId));
  if(!user || !await verifyPassword(data.currentPassword,user.passwordHash)) throw new HttpError(400,"Email or password is incorrect");
  await db.update(users).set({passwordHash:await hashPassword(data.newPassword),updatedAt:new Date().toISOString()}).where(eq(users.id,userId));
}
export async function deleteAccount(userId:string) {await (await getDb()).delete(users).where(eq(users.id,userId));}
