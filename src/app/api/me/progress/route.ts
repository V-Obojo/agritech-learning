import { z } from "zod";
import { authenticated,readBody } from "@/lib/auth/http";
import { progressSchema } from "@/lib/progress";
import { getAccountProgress,putAccountProgress } from "@/lib/db/account-data";
const requestSchema=z.object({progress:progressSchema,merge:z.boolean().optional()}).strict();
export async function GET(request:Request) {return authenticated(request,async id=>Response.json(await getAccountProgress(id)));}
export async function PUT(request:Request) {
  return authenticated(request,async id=>{
    const data=await readBody(request,requestSchema,262144);
    return Response.json(await putAccountProgress(id,data.progress,data.merge));
  });
}
