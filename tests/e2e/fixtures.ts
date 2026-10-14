import { test as base, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { Activity, Catalog, SubjectPath, TopicConfig } from "../../src/lib/content/schemas";
export const test=base.extend<{localOnly:void}>({
  channel:[process.platform==="win32" ? "msedge" : undefined,{scope:"worker"}],
  localOnly:[async({page},use)=>{
    const errors:string[]=[];
    page.on("pageerror",error=>errors.push(error.message));
    page.on("console",message=>{if(message.type()==="error") errors.push(message.text());});
    await page.route("**/*",route=>{
      const hostname=new URL(route.request().url()).hostname;
      if(hostname==="localhost" || hostname==="127.0.0.1") return route.continue();
      errors.push(`Unexpected external request: ${hostname}`);return route.abort();
    });
    await use(); expect(errors).toEqual([]);
  },{auto:true}],
});
export {expect};
export const catalog=JSON.parse(readFileSync("content/catalog.json","utf8")) as Catalog;
export const animalArea=catalog.areas.find(area=>area.subjects.some(subject=>subject.id==="fish-farming"))!;
export const fishSubject=animalArea.subjects.find(subject=>subject.id==="fish-farming")!;
export const fishPath=JSON.parse(readFileSync(path.join("content",fishSubject.path!,"path.json"),"utf8")) as SubjectPath;
export const areaUrl=`/${animalArea.slug}`;
export const hubUrl=`${areaUrl}/${fishSubject.slug}`;
export function topicData(slug:string) {
  const meta=fishPath.topics.find(topic=>topic.slug===slug)!;
  const directory=path.join("content",fishSubject.path!,meta.id);
  return {meta,subjectId:fishSubject.id,url:`${hubUrl}/${meta.slug}`,key:`${fishSubject.id}/${meta.id}`,
    config:JSON.parse(readFileSync(path.join(directory,"topic.json"),"utf8")) as TopicConfig,
    activity:JSON.parse(readFileSync(path.join(directory,"activity.json"),"utf8")) as Activity};
}
export const water=topicData("water");
export const firstTopic=topicData(fishPath.topics.filter(topic=>topic.status==="live").sort((a,b)=>a.order-b.order)[0].slug);
export const activity=water.activity;
export const pathway=water.config;
export const fictionalAnswer="Amina's well ran low in the dry season. She needs to find out about testing the water.";
export const tundeAnswer="Tunde works weekdays far from the site and has some savings. He should learn from an experienced farmer before investing.";
export async function chooseIntention(page:Page,id="curious") {
  await page.getByRole("radio",{name:catalog.intentions.find(intention=>intention.id===id)!.label,exact:true}).check();
}
export async function openFishHub(page:Page) {
  await page.goto("/");
  await page.locator(`a.navigation-card[href="${areaUrl}"]`).click();
  await expect(page.getByRole("heading",{name:animalArea.label,exact:true})).toBeVisible();
  await page.locator(`a.navigation-card[href="${hubUrl}"]`).click();
  await expect(page.getByRole("heading",{name:fishPath.title,exact:true})).toBeVisible();
}
export async function openTopic(page:Page,slug:string) {
  await openFishHub(page);
  const topic=topicData(slug);
  await page.locator(`a.topic-card[href="${topic.url}"]`).click();
  await expect(page.getByRole("heading",{name:topic.meta.title,exact:true})).toBeVisible();
}
export async function startLesson(page:Page) {
  await page.goto("/");await chooseIntention(page);await openTopic(page,water.meta.slug);
}
export async function answerCheck(page:Page,topic=water) {
  for(const question of topic.config.understandingCheck) await page.getByRole("group",{name:question.question,exact:true}).getByRole("radio").nth(question.answerIndex).check();
}
export async function submitActivity(page:Page,pathId:string,answer:string,topic=water) {
  const option=topic.activity.paths.find(option=>option.id===pathId)!;
  await page.getByRole("radio",{name:option.label,exact:true}).check();
  await page.getByLabel("Your answer",{exact:true}).fill(answer);
  const response=page.waitForResponse(response=>response.url().endsWith("/api/feedback") && response.request().method()==="POST");
  await page.getByRole("button",{name:"Get feedback",exact:true}).click();
  const data=await (await response).json();expect(data.mode).toBe("mock");return data;
}
export async function askGuide(page:Page,question:string,citation:string) {
  const guide=page.getByRole("region",{name:"Ask the learning guide",exact:true});
  await guide.getByLabel("Your question").fill(question);
  const response=page.waitForResponse(response=>response.url().endsWith("/api/guide") && response.request().method()==="POST");
  await guide.getByRole("button",{name:"Ask guide",exact:true}).click();
  expect((await (await response).json()).mode).toBe("mock");
  await expect(guide.locator(`a[href="#${citation}"]`)).toBeVisible();
}
export async function events(page:Page) {
  return page.evaluate(()=>JSON.parse(localStorage.getItem("agri-events-v1") ?? "[]") as {name:string;at:string;details:Record<string,string|number|boolean>}[]);
}
export async function expectTopicMetrics(page:Page,topic=water) {
  const log=await events(page);
  for(const event of log.filter(event=>!["intention_chosen","area_opened","subject_opened"].includes(event.name))) {
    expect(event.details.subjectId).toBe(topic.subjectId);expect(event.details.topicId).toBe(topic.meta.id);
  }
  expect(log.every(event=>!Number.isNaN(Date.parse(event.at)))).toBe(true);
  expect(JSON.stringify(log)).not.toContain("Why does");expect(JSON.stringify(log)).not.toContain("well ran low");
}
