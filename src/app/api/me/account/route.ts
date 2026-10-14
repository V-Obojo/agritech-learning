import { authenticated,readBody } from "@/lib/auth/http";
import { deleteAccount } from "@/lib/auth/accounts";
import { deleteAccountSchema } from "@/lib/auth/validation";
export async function DELETE(request:Request) {return authenticated(request,async id=>{
  await readBody(request,deleteAccountSchema);await deleteAccount(id);return Response.json({deleted:true});
});}
