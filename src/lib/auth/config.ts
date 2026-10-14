import "server-only";
import type { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { eq } from "drizzle-orm";
import { getDb } from "../db";
import { users } from "../db/schema";
import { signinSchema } from "./validation";
import { verifyPassword } from "./password";

export function requireAuthSecret() {
  const secret=process.env.NEXTAUTH_SECRET;
  if(!secret?.trim()) throw new Error("Set NEXTAUTH_SECRET before starting accounts. Follow 'Set up accounts locally' in README.md; the app never generates a secret.");
  return secret;
}
export async function authorizeCredentials(value:unknown) {
  const parsed=signinSchema.safeParse(value);
  if(!parsed.success) return null;
  const [user]=await (await getDb()).select().from(users).where(eq(users.email,parsed.data.email));
  if(!user || !await verifyPassword(parsed.data.password,user.passwordHash)) return null;
  return {id:user.id,name:user.name,email:user.email};
}
export function authOptions():NextAuthOptions {
  return {
    secret:requireAuthSecret(),session:{strategy:"jwt"},pages:{signIn:"/signin"},debug:false,
    // Auth errors are returned generically; never pass request/token metadata to logs.
    logger:{error(){},warn(){},debug(){}},
    providers:[Credentials({name:"Email and password",credentials:{email:{label:"Email",type:"email"},password:{label:"Password",type:"password"}},
      authorize:credentials=>authorizeCredentials({email:credentials?.email,password:credentials?.password})})],
    callbacks:{
      async jwt({token,user}) { if(user) token.sub=user.id; return token; },
      async session({session,token}) {
        const [user]=token.sub ? await (await getDb()).select({id:users.id,name:users.name,email:users.email}).from(users).where(eq(users.id,token.sub)) : [];
        return {...session,user};
      },
      async redirect({url,baseUrl}) {
        try {const target=new URL(url,baseUrl);if(target.origin===new URL(baseUrl).origin) return target.href;} catch {}
        return `${baseUrl}/dashboard`;
      },
    },
  };
}
