import { authenticated,readBody } from "@/lib/auth/http";
import { addGuideHistory,guideHistorySchema } from "@/lib/db/account-data";
export async function POST(request:Request) {return authenticated(request,async id=>{
  await addGuideHistory(id,await readBody(request,guideHistorySchema,32768));return Response.json({saved:true},{status:201});
});}
