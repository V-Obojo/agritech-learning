import { z } from "zod";
import { eq } from "drizzle-orm";
import { authenticated,readBody } from "@/lib/auth/http";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
const schema=z.object({theme:z.enum(["light","dark"]).nullable()}).strict();
export async function PUT(request:Request) {return authenticated(request,async id=>{
  const data=await readBody(request,schema);await (await getDb()).update(users).set({...data,updatedAt:new Date().toISOString()}).where(eq(users.id,id));return Response.json({saved:true});
});}
