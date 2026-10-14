import { createAccount } from "@/lib/auth/accounts";
import { failure,readBody,sameOrigin,HttpError } from "@/lib/auth/http";
import { signupSchema } from "@/lib/auth/validation";
import { allowSignup } from "@/lib/auth/rate-limit";
export async function POST(request:Request) {
  try {
    sameOrigin(request);
    if(!process.env.NEXTAUTH_SECRET?.trim()) throw new HttpError(503,"Set NEXTAUTH_SECRET before using accounts. See Set up accounts locally in README.md.");
    const ip=request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
    if(!allowSignup(ip)) throw new HttpError(429,"Please wait before trying again.");
    await createAccount(await readBody(request,signupSchema));
    return Response.json({created:true},{status:201});
  } catch(error) {return failure(error);}
}
