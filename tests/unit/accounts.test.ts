import { beforeAll,afterAll,describe,it,expect,vi } from "vitest";
import { mkdtemp,rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
vi.mock("server-only",()=>({}));
const current=vi.hoisted(()=>({id:null as string|null}));
vi.mock("../../src/lib/auth/session",()=>({getCurrentUser:async()=>current.id ? {id:current.id} : null}));
import { getDb,migrateDb } from "../../src/lib/db";
import { dashboardPrefs,events,guideHistory,progress,users } from "../../src/lib/db/schema";
import { createAccount,deleteAccount } from "../../src/lib/auth/accounts";
import { hashPassword,verifyPassword } from "../../src/lib/auth/password";
import { authorizeCredentials,authOptions,requireAuthSecret } from "../../src/lib/auth/config";
import { passwordSchema,signupSchema,safeCallback } from "../../src/lib/auth/validation";
import { defaultProgress } from "../../src/lib/progress";
import { POST as signup } from "../../src/app/api/auth/signup/route";
import { GET,PUT } from "../../src/app/api/me/progress/route";
import { POST as postEvents } from "../../src/app/api/me/events/route";
import { DELETE } from "../../src/app/api/me/account/route";
import { PUT as changePassword } from "../../src/app/api/me/password/route";
import { POST as saveGuideHistory } from "../../src/app/api/me/guide-history/route";
import { getTopic } from "../../src/lib/content";
let directory:string;
const password="UnitFixture12";
function details() {return {name:"Test Learner",email:`unit-${randomUUID()}@example.test`,password};}
function request(body?:unknown,method="POST",path="http://localhost/api/auth/signup",ip=randomUUID()) {return new Request(path,{method,headers:{"Content-Type":"application/json","x-forwarded-for":ip},...(body===undefined ? {} : {body:JSON.stringify(body)})});}
beforeAll(async()=>{
  directory=await mkdtemp(join(tmpdir(),"ovayi-test-unit-"));vi.stubEnv("DATABASE_URL",pathToFileURL(join(directory,"test-accounts.db")).href);vi.stubEnv("DATABASE_AUTH_TOKEN","");vi.stubEnv("NEXTAUTH_SECRET","offline-unit-fixture-only-not-for-deployment");
  vi.stubGlobal("fetch",vi.fn(()=>{throw new Error("Tests must not call the network.");}));await migrateDb();
});
afterAll(async()=>{(await getDb()).$client.close();vi.unstubAllGlobals();vi.unstubAllEnvs();if(process.platform!=="win32" && directory.startsWith(join(tmpdir(),"ovayi-test-unit-"))) await rm(directory,{recursive:true,force:true});});
describe("account security and migrated SQLite",()=>{
  it("keeps foreign-key cascades enabled on additional pooled connections",async()=>{
    const client=(await getDb()).$client,transaction=await client.transaction("read");
    try {expect(Number((await client.execute("PRAGMA foreign_keys")).rows[0][0])).toBe(1);} finally {await transaction.rollback();}
  });
  it("validates policy and hashes/compares without exposing the encoded value",async()=>{
    for(const value of ["short1","onlyletters","123456789","é".repeat(40)+"A1"]) expect(passwordSchema.safeParse(value).success).toBe(false);
    const encoded=await hashPassword(password);expect(encoded===password).toBe(false);expect(await verifyPassword(password,encoded)).toBe(true);expect(await verifyPassword("WrongFixture12",encoded)).toBe(false);
  });
  it("validates signup fields and normalized emails",()=>{
    expect(signupSchema.parse({...details(),email:" TEST@EXAMPLE.TEST "}).email).toBe("test@example.test");
    for(const patch of [{name:""},{name:"x".repeat(61)},{email:"bad"},{password:"invalid"},{state:"Unknown"},{extra:"overposting"}]) expect(signupSchema.safeParse({...details(),...patch}).success).toBe(false);
  });
  it("creates an account and rejects duplicate lowercased email generically",async()=>{
    const data=details();expect((await signup(request(data))).status).toBe(201);
    const response=await signup(request({...data,email:data.email.toUpperCase()}));expect(response.status).toBe(409);expect(await response.json()).toEqual({error:"Unable to create an account with those details."});
    expect((await authorizeCredentials({email:data.email,password}))?.name).toBe(data.name);expect(await authorizeCredentials({email:data.email,password:"WrongFixture12"})).toBeNull();
  });
  it("returns 400 for invalid signup and 429 after ten attempts in ten minutes",async()=>{
    const ip=randomUUID();for(let index=0;index<10;index++) expect((await signup(request({name:""},"POST",undefined,ip))).status).toBe(400);
    expect((await signup(request(details(),"POST",undefined,ip))).status).toBe(429);
  });
  it("rejects unauthenticated progress reads and writes",async()=>{
    current.id=null;expect((await GET(request(undefined,"GET","http://localhost/api/me/progress"))).status).toBe(401);
    expect((await PUT(request({progress:defaultProgress()},"PUT","http://localhost/api/me/progress"))).status).toBe(401);
  });
  it("scopes progress to two independent users and rejects overposting, size and cross-origin writes",async()=>{
    const first=await createAccount(details()),second=await createAccount(details());current.id=first;
    const saved={...defaultProgress(),lastPath:"/first/path"};expect((await PUT(request({progress:saved},"PUT","http://localhost/api/me/progress"))).status).toBe(200);
    current.id=second;expect((await (await GET(request(undefined,"GET"))).json()).lastPath).toBeNull();
    expect((await PUT(request({progress:saved,userId:first},"PUT"))).status).toBe(400);
    expect((await PUT(request({progress:{...saved,extra:"x".repeat(270000)}},"PUT"))).status).toBe(413);
    const cross=request({progress:saved},"PUT");cross.headers.set("origin","https://example.test");expect((await PUT(cross)).status).toBe(403);
    current.id=first;expect((await (await GET(request(undefined,"GET"))).json()).lastPath).toBe("/first/path");
  });
  it("deduplicates events by user, name and timestamp",async()=>{
    current.id=await createAccount(details());const event={name:"intention_chosen",details:{intention:"student"},at:"2026-10-14T10:00:00.000Z"};
    for(let index=0;index<2;index++) expect((await postEvents(request({events:[event]},"POST"))).status).toBe(200);
    expect((await (await getDb()).select({id:events.id}).from(events).where(eq(events.userId,current.id))).length).toBe(1);
  });
  it("requires the current password and changes the hash",async()=>{
    const data=details();current.id=await createAccount(data);
    expect((await changePassword(request({currentPassword:"WrongFixture12",newPassword:"ChangedFixture12"},"PUT"))).status).toBe(400);
    expect((await changePassword(request({currentPassword:password,newPassword:"ChangedFixture12"},"PUT"))).status).toBe(200);
    expect(Boolean(await authorizeCredentials({email:data.email,password}))).toBe(false);expect(Boolean(await authorizeCredentials({email:data.email,password:"ChangedFixture12"}))).toBe(true);
  });
  it("stores guide history under the signed-in user and validates topic citations",async()=>{
    current.id=await createAccount(details());const topic=getTopic("fish-farming","water"),chunk=topic.lesson.chunks[0];
    const data={subjectId:"fish-farming",topicId:topic.meta.id,question:"A question",answer:chunk.body,supported:true,citations:[{chunkId:chunk.id,title:chunk.title}]};
    expect((await saveGuideHistory(request(data))).status).toBe(201);
    const rows=await (await getDb()).select({userId:guideHistory.userId,question:guideHistory.question}).from(guideHistory).where(eq(guideHistory.userId,current.id));
    expect(rows.length).toBe(1);expect(rows[0].question).toBe(data.question);
    expect((await saveGuideHistory(request({...data,citations:[{chunkId:"unknown",title:"Unknown"}]}))).status).toBe(400);
    current.id=null;expect((await saveGuideHistory(request(data))).status).toBe(401);
  });
  it("requires DELETE confirmation and cascades every related table without touching another user",async()=>{
    const id=await createAccount(details()),other=await createAccount(details()),db=await getDb(),at=new Date().toISOString();current.id=id;
    await db.insert(events).values({id:randomUUID(),userId:id,name:"intention_chosen",details:{},createdAt:at});
    await db.insert(dashboardPrefs).values({userId:id,widgets:[],updatedAt:at});
    await db.insert(guideHistory).values({id:randomUUID(),userId:id,subjectId:"subject",topicId:"topic",question:"Question",answer:"Answer",supported:false,citations:[],createdAt:at});
    expect((await DELETE(request({confirmation:"NO"},"DELETE"))).status).toBe(400);expect((await DELETE(request({confirmation:"DELETE"},"DELETE"))).status).toBe(200);
    for(const table of [progress,events,dashboardPrefs,guideHistory]) expect((await db.select({userId:table.userId}).from(table).where(eq(table.userId,id))).length).toBe(0);
    expect((await db.select({id:users.id}).from(users).where(eq(users.id,id))).length).toBe(0);expect((await db.select({id:users.id}).from(users).where(eq(users.id,other))).length).toBe(1);
    await deleteAccount(other);
  });
  it("rejects external and browser-normalized callback origins",async()=>{
    const redirect=authOptions().callbacks!.redirect!;
    for(const url of ["https://example.test","//example.test","/\\example.test","/\t/example.test"]) expect(new URL(await redirect({url,baseUrl:"http://localhost"})).origin).toBe("http://localhost");
  });
  it("fails clearly without a secret and confines callbacks to local paths",()=>{
    vi.stubEnv("NEXTAUTH_SECRET","");expect(()=>requireAuthSecret()).toThrow("Set NEXTAUTH_SECRET");
    for(const value of ["//example.test","/\\example.test","https://example.test","/bad\npath","/\t/example.test"]) expect(safeCallback(value)).toBe("/dashboard");expect(safeCallback("/account")).toBe("/account");
  });
});
