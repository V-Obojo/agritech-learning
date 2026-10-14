import { authenticated,readBody } from "@/lib/auth/http";
import { changePassword } from "@/lib/auth/accounts";
import { changePasswordSchema } from "@/lib/auth/validation";
export async function PUT(request:Request) {return authenticated(request,async id=>{
  await changePassword(id,await readBody(request,changePasswordSchema));return Response.json({saved:true});
});}
