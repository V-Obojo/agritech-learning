import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth/config";
async function handler(request:NextRequest,context:{params:Promise<{nextauth:string[]}>}) {
  if(!process.env.NEXTAUTH_SECRET?.trim()) return Response.json({error:"Set NEXTAUTH_SECRET before using accounts. See Set up accounts locally in README.md."},{status:503});
  return NextAuth(authOptions())(request,context);
}
export {handler as GET,handler as POST};
