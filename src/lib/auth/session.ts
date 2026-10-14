import "server-only";
import { connection } from "next/server";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "../db";
import { users } from "../db/schema";
import { authOptions } from "./config";
import type { AccountProfile } from "./account-types";

export async function getCurrentUser():Promise<AccountProfile|null> {
  await connection(); // next-auth creates random CSRF values; wait for a real request, inside Suspense.
  const session=await getServerSession(authOptions());
  if(!session?.user?.id) return null;
  const [user]=await (await getDb()).select({id:users.id,email:users.email,name:users.name,state:users.state,intention:users.intention,theme:users.theme}).from(users).where(eq(users.id,session.user.id));
  return user ? {...user,theme:user.theme==="light" || user.theme==="dark" ? user.theme : null} : null;
}
export async function requireUser(path:string) {
  const user=await getCurrentUser();
  if(!user) redirect(`/signin?callbackUrl=${encodeURIComponent(path)}`);
  return user;
}
