import { authenticated,readBody } from "@/lib/auth/http";
import { updateProfile } from "@/lib/auth/accounts";
import { profileSchema } from "@/lib/auth/validation";
export async function PUT(request:Request) {return authenticated(request,async id=>{
  await updateProfile(id,await readBody(request,profileSchema));return Response.json({saved:true});
});}
