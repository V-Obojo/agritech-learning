import { z } from "zod";
import { authenticated,readBody } from "@/lib/auth/http";
import { eventSchema } from "@/lib/metrics";
import { addAccountEvents,getAccountEvents } from "@/lib/db/account-data";
const requestSchema=z.object({events:z.array(eventSchema).max(200)}).strict();
export async function GET(request:Request) {return authenticated(request,async id=>Response.json(await getAccountEvents(id)));}
export async function POST(request:Request) {return authenticated(request,async id=>{
  const data=await readBody(request,requestSchema,131072);await addAccountEvents(id,data.events);return Response.json({saved:true});
});}
