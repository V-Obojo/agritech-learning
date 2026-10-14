import "server-only";
import { z } from "zod";
import { getCurrentUser } from "./session";

export class HttpError extends Error { constructor(public status:number,message:string) {super(message);} }
export function sameOrigin(request:Request) {
  const origin=request.headers.get("origin");
  if(origin && origin!==new URL(request.url).origin) throw new HttpError(403,"This request is not allowed.");
}
export async function readBody<T>(request:Request,schema:z.ZodType<T>,limit=8192):Promise<T> {
  if(Number(request.headers.get("content-length") ?? 0)>limit) throw new HttpError(413,"This request is too large.");
  const reader=request.body?.getReader(),decoder=new TextDecoder(),parts:string[]=[];
  let size=0;
  if(reader) while(true) {
    const {done,value}=await reader.read();if(done) break;
    size+=value.byteLength;
    if(size>limit) {await reader.cancel();throw new HttpError(413,"This request is too large.");}
    parts.push(decoder.decode(value,{stream:true}));
  }
  const body=parts.join("")+decoder.decode();
  let value:unknown;
  try {value=JSON.parse(body);} catch {throw new HttpError(400,"Enter valid details and try again.");}
  const parsed=schema.safeParse(value);
  if(!parsed.success) throw new HttpError(400,"Enter valid details and try again.");
  return parsed.data;
}
export function failure(error:unknown) {
  return Response.json({error:error instanceof HttpError ? error.message : "The account service is unavailable. Please try again."},{status:error instanceof HttpError ? error.status : 503});
}
export async function authenticated(request:Request,work:(userId:string)=>Promise<Response>) {
  try {
    const user=await getCurrentUser();
    if(!user) return Response.json({error:"Sign in to continue."},{status:401});
    if(request.method!=="GET") sameOrigin(request);
    const response=await work(user.id);
    response.headers.set("Cache-Control","private, no-store");return response;
  } catch(error) {return failure(error);}
}
