import { beforeAll,afterAll,it,expect,vi } from "vitest";
import { mkdtemp,rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { pathToFileURL } from "node:url";
vi.mock("server-only",()=>({}));
const current=vi.hoisted(()=>({id:null as string|null}));
vi.mock("../../src/lib/auth/session",()=>({getCurrentUser:async()=>current.id ? {id:current.id} : null}));
import { getDb,migrateDb } from "../../src/lib/db";
import { users,events,guideHistory } from "../../src/lib/db/schema";
import { GET,PUT } from "../../src/app/api/me/dashboard/route";
import { defaultLayout } from "../../src/lib/insights/layout";
import { getDashboardData } from "../../src/lib/insights/data";
import { getInsightContent } from "../../src/lib/insights/content";
let directory:string;
const now=new Date("2026-10-14T10:00:00Z");
function request(body?:unknown,headers:Record<string,string>={}) {return new Request("http://localhost/api/me/dashboard",{method:body ? "PUT" : "GET",headers:{"Content-Type":"application/json",...headers},...(body ? {body:JSON.stringify(body)} : {})});}
beforeAll(async()=>{
  directory=await mkdtemp(join(tmpdir(),"ovayi-test-dashboard-"));vi.stubEnv("DATABASE_URL",pathToFileURL(join(directory,"test-dashboard.db")).href);vi.stubEnv("DATABASE_AUTH_TOKEN","");
  vi.stubGlobal("fetch",vi.fn(()=>{throw new Error("No network in unit tests");}));await migrateDb();
  await (await getDb()).insert(users).values(["one","two"].map(id=>({id,name:"Learner",email:`${id}@example.test`,passwordHash:"unused-test-fixture",createdAt:now.toISOString(),updatedAt:now.toISOString()})));
});
afterAll(async()=>{(await getDb()).$client.close();vi.unstubAllGlobals();vi.unstubAllEnvs();if(process.platform!=="win32"&&directory.startsWith(join(tmpdir(),"ovayi-test-dashboard-"))) await rm(directory,{recursive:true,force:true});});
it("requires a session and keeps complete validated layouts private to each user",async()=>{
  current.id=null;expect((await GET(request())).status).toBe(401);expect((await PUT(request({widgets:defaultLayout()}))).status).toBe(401);
  current.id="one";const widgets=defaultLayout().reverse().map(w=>({...w,visible:w.id!=="activity-chart"}));
  expect((await PUT(request({widgets}))).status).toBe(200);const response=await GET(request());expect(response.headers.get("Cache-Control")).toContain("no-store");expect(await response.json()).toEqual({widgets});
  current.id="two";expect(await (await GET(request())).json()).toEqual({widgets:defaultLayout()});
  for(const body of [{widgets:widgets.slice(1)},{widgets:[...widgets.slice(1),widgets[1]]},{widgets,userId:"one"},{widgets:widgets.map(w=>({...w,id:"foreign"}))}]) expect((await PUT(request(body))).status).toBe(400);
  expect((await PUT(request({widgets},{Origin:"https://external.test"}))).status).toBe(403);
});
it("server data reads only the learner's last 90 days and 20 recent guide entries",async()=>{
  const db=await getDb(),topic=getInsightContent().topics[0];
  await db.insert(events).values([{id:"old",userId:"one",name:"lesson_viewed",details:{subjectId:topic.subjectId,topicId:topic.topicId},createdAt:"2026-01-01T10:00:00Z"},{id:"recent",userId:"one",name:"lesson_viewed",details:{subjectId:topic.subjectId,topicId:topic.topicId},createdAt:now.toISOString()},{id:"foreign",userId:"two",name:"lesson_viewed",details:{subjectId:topic.subjectId,topicId:topic.topicId},createdAt:now.toISOString()}]);
  await db.insert(guideHistory).values(Array.from({length:23},(_,i)=>({id:`guide-${i}`,userId:i===22 ? "two" : "one",subjectId:topic.subjectId,topicId:topic.topicId,question:`Question ${i}`,answer:"Fixture answer",supported:false,citations:[],createdAt:new Date(now.getTime()+i*1000).toISOString()})));
  const data=await getDashboardData("one",new Date(now.getTime()+30000));expect(data.events).toHaveLength(1);expect(data.history).toHaveLength(20);expect(data.history[0].question).toBe("Question 21");expect(data.history.every(h=>h.question!=="Question 22")).toBe(true);
});
