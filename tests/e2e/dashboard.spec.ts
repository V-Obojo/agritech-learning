import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { test,expect,firstTopic,answerCheck,submitActivity } from "./fixtures";
import badgesJson from "../../content/badges.json";
import { defaultLayout } from "../../src/lib/insights/layout";
const directory="test-results/phase-11";
async function signup(page:import("@playwright/test").Page) {
  await page.goto("/signup");await page.getByLabel("Name",{exact:true}).fill("Growing Learner");await page.getByLabel("Email",{exact:true}).fill(`dashboard-${randomUUID()}@example.test`);await page.getByLabel("Password",{exact:true}).fill("DashboardFixture12");await page.getByRole("button",{name:"Create account",exact:true}).click();await expect(page).toHaveURL("/dashboard");await expect(page.getByRole("heading",{name:"Your progress",exact:true})).toBeVisible();
}
test("dashboard: completion, badges, streak, saved customization, keyboard/pointer ordering and reset",async({page},testInfo)=>{
  await signup(page);await page.goto(firstTopic.url);await answerCheck(page,firstTopic);
  const firstBadge=badgesJson.badges.find(b=>b.rule.type==="first-topic-started")!,completedBadge=badgesJson.badges.find(b=>b.rule.type==="topic-complete"&&"topicId" in b.rule&&b.rule.topicId===firstTopic.meta.id)!;
  await expect(page.getByRole("status").filter({hasText:`Badge earned: ${firstBadge.label}`})).toBeVisible();
  await page.goto(`${firstTopic.url}/activity`);const path=firstTopic.activity.paths[0];const result=await submitActivity(page,path.id,path.example!,firstTopic);expect(result.completed).toBe(true);
  await expect(page.getByRole("status").filter({hasText:`Badge earned: ${completedBadge.label}`})).toBeVisible();
  await expect.poll(async()=>{const p=await (await page.request.get("/api/me/progress")).json();return Boolean(p.topics[firstTopic.key]?.completed&&p.celebratedBadges[completedBadge.id]);}).toBe(true);
  await page.goto("/dashboard");await expect(page.getByRole("region",{name:"Understanding checks",exact:true})).toContainText("Done");
  for(const badge of [firstBadge,completedBadge]) await expect(page.getByRole("region",{name:"Badges",exact:true}).locator('[data-earned="true"]').filter({hasText:badge.label}).first()).toBeVisible();
  await expect(page.getByRole("region",{name:"Learning streak",exact:true})).toContainText("Longest streak: 1 day");
  await expect(page.locator('[data-chart="learning-activity"]')).toBeVisible();await page.emulateMedia({reducedMotion:"reduce"});await mkdir(directory,{recursive:true});
  const original=page.viewportSize()!;
  for(const width of [375,768,1280,1440]) {
    await page.setViewportSize({width,height:original.height});
    const columns=await page.getByLabel("Dashboard widgets",{exact:true}).evaluate(element=>getComputedStyle(element).gridTemplateColumns.split(" ").length);expect(columns).toBe(width>=768 ? 12 : 1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize(original);
  await expect(page.getByRole("region",{name:"Continue learning",exact:true})).toHaveCSS("border-top-style","solid");
  await page.screenshot({path:`${directory}/${testInfo.project.name}-dashboard.png`,fullPage:true});await page.screenshot({path:`${directory}/${testInfo.project.name}-dashboard-top.png`});
  await page.getByRole("button",{name:"Customize",exact:true}).click();await page.getByRole("checkbox",{name:"Learning activity",exact:true}).uncheck();
  const up=page.getByRole("button",{name:"Move Badges up",exact:true});for(let i=0;i<3;i++) {await up.focus();await page.keyboard.press("Enter");}
  await expect(page.locator("[data-widget]").first()).toHaveAttribute("data-widget","badges");await expect(page.getByRole("status").filter({hasText:"Layout saved"})).toBeVisible();
  await page.getByRole("button",{name:"Done customizing",exact:true}).click();await page.reload();await expect(page.locator("[data-widget]").first()).toHaveAttribute("data-widget","badges");await expect(page.getByRole("region",{name:"Learning activity",exact:true})).toHaveCount(0);
  await expect(page.getByRole("status").filter({hasText:"Badge earned:"})).toHaveCount(0);
  await page.getByRole("button",{name:"Customize",exact:true}).click();await page.getByRole("button",{name:"Reset layout",exact:true}).click();await expect(page.getByRole("status").filter({hasText:"Layout saved"})).toBeVisible();
  expect(await page.locator("[data-widget]").evaluateAll(items=>items.map(i=>i.getAttribute("data-widget")))).toEqual(defaultLayout().map(w=>w.id));
  // Pointer handles work on the same touch-safe pointer path as mouse input.
  const handle=page.getByRole("button",{name:"Drag Learning streak",exact:true}),target=page.getByRole("heading",{name:"Continue learning",exact:true});
  await target.evaluate(element=>window.scrollTo(0,element.getBoundingClientRect().top+window.scrollY-160));
  const a=await handle.boundingBox(),b=await target.boundingBox();expect(a&&b).toBeTruthy();
  await page.mouse.move(a!.x+a!.width/2,a!.y+a!.height/2);await page.mouse.down();await page.mouse.move(b!.x+b!.width/2,b!.y+b!.height/2,{steps:10});await page.mouse.up();await expect(page.locator("[data-widget]").first()).toHaveAttribute("data-widget","streak");
  await expect(page.getByRole("status").filter({hasText:"Layout saved"})).toBeVisible();await page.getByRole("button",{name:"Reset layout",exact:true}).click();await expect(page.getByRole("status").filter({hasText:"Layout saved"})).toBeVisible();await page.getByRole("button",{name:"Done customizing",exact:true}).click();
  await page.reload();await expect(page.getByRole("region",{name:"Learning activity",exact:true})).toBeVisible();expect((await (await page.request.get("/api/me/dashboard")).json()).widgets).toEqual(defaultLayout());
});
test("chart JavaScript stays off learning pages and guest badges celebrate once",async({page})=>{
  const scripts:string[]=[];page.on("request",request=>{if(new URL(request.url()).pathname.endsWith(".js")) scripts.push(request.url());});
  async function readScripts(urls:string[]) {return Promise.all([...new Set(urls)].map(async url=>{const response=await page.request.get(url);expect(response.ok()).toBe(true);return {url,body:await response.text()};}));}
  await page.goto(firstTopic.url);await expect(page.getByRole("article")).toBeVisible();const badge=badgesJson.badges.find(b=>b.rule.type==="first-topic-started")!;await expect(page.getByRole("status").filter({hasText:`Badge earned: ${badge.label}`})).toBeVisible();
  await expect.poll(async()=>page.evaluate(id=>Boolean(JSON.parse(localStorage.getItem("agri-progress-v2")||"{}").celebratedBadges?.[id]),badge.id)).toBe(true);
  await page.reload();await expect(page.getByRole("article")).toBeVisible();await expect(page.getByRole("status").filter({hasText:"Badge earned:"})).toHaveCount(0);
  const learningScripts=await readScripts(scripts);expect(learningScripts.length).toBeGreaterThan(0);expect(learningScripts.some(s=>s.body.includes('data-chart')&&s.body.includes('learning-activity'))).toBe(false);
  const count=scripts.length;await signup(page);await expect(page.locator('[data-chart="learning-activity"]')).toBeVisible();const dashboardScripts=await readScripts(scripts.slice(count));const chart=dashboardScripts.filter(s=>s.body.includes('data-chart')&&s.body.includes('learning-activity'));expect(chart.length).toBeGreaterThan(0);expect(chart.every(s=>!learningScripts.some(l=>l.url===s.url))).toBe(true);
});
