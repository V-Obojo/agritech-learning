import {randomUUID} from "node:crypto";
import {mkdir,writeFile} from "node:fs/promises";
import {test,expect,catalog,animalArea,areaUrl,hubUrl,fishPath,firstTopic,topicData,chooseIntention,answerCheck,askGuide,closeGuide,submitActivity} from "./fixtures";
import {labs,labFrame,completeLabs,accountLabsSaved} from "./lab-actions";
import badgesJson from "../../content/badges.json";
const directory="test-results/phase-14";
test("v2 journey: visitor lesson, account merge, four labs, dashboard, return and theme",async({page},info)=>{
  test.setTimeout(180000);await page.emulateMedia({reducedMotion:"reduce",colorScheme:"light"});await mkdir(directory,{recursive:true});
  await page.goto("/");await expect(page.locator(".hero")).toContainText(catalog.product.heroHeadline);await page.screenshot({path:`${directory}/${info.project.name}-home.png`,scale:"css"});await chooseIntention(page);
  await page.locator(`a.navigation-card[href="${areaUrl}"]`).click();await expect(page.getByRole("heading",{name:animalArea.label,exact:true})).toBeVisible();await page.locator(`a.navigation-card[href="${hubUrl}"]`).click();await page.locator(`a.topic-card[href="${firstTopic.url}"]`).click();
  await answerCheck(page,firstTopic);await askGuide(page,"What do I need to start fish farming?","wf-05");await closeGuide(page);await page.getByRole("link",{name:"Try the activity",exact:true}).click();
  const firstPath=firstTopic.activity.paths.find(p=>p.id==="fictional")!;expect((await submitActivity(page,firstPath.id,firstPath.modelPoints!.map(p=>p.point).join(" "),firstTopic)).completed).toBe(true);await page.getByRole("link",{name:"See my next steps",exact:true}).click();await expect(page).toHaveURL(`${firstTopic.url}/next`);
  const email=`journey-${randomUUID()}@example.test`,password="JourneyFixture14";
  await page.goto("/signup");await page.getByLabel("Name",{exact:true}).fill("Curious Learner");await page.getByLabel("Email",{exact:true}).fill(email);await page.getByLabel("Password",{exact:true}).fill(password);await page.getByRole("button",{name:"Create account",exact:true}).click();await expect(page).toHaveURL("/dashboard");
  await expect.poll(async()=>Boolean((await(await page.request.get("/api/me/progress")).json()).topics?.[firstTopic.key]?.completed)).toBe(true);
  for(const meta of fishPath.topics.filter(t=>t.status==="live"&&t.id!==firstTopic.meta.id).sort((a,b)=>a.order-b.order)) {
    const topic=topicData(meta.slug);await page.goto(topic.url);await answerCheck(page,topic);await completeLabs(page,meta.id);await accountLabsSaved(page,meta.id);
    if(labs.some(l=>l.topicId===meta.id&&l.type==="model-viewer")) {
      await page.getByRole("button",{name:/Enlarge image:/}).first().click();await expect(page.getByRole("dialog",{name:"Image viewer"})).toBeVisible();await page.keyboard.press("Escape");
      await labFrame(page,labs.find(l=>l.type==="model-viewer")!.id).screenshot({path:`${directory}/${info.project.name}-model.png`,scale:"css",style:".site-header,.skip-link,.ov-badge-toasts,.guide-trigger{visibility:hidden}"});
    }
    await page.goto(`${topic.url}/activity`);const path=topic.activity.paths.find(p=>p.example)!;expect((await submitActivity(page,path.id,path.example!,topic)).completed).toBe(true);await page.getByRole("link",{name:"See my next steps",exact:true}).click();
    await expect.poll(async()=>Boolean((await(await page.request.get("/api/me/progress")).json()).topics?.[topic.key]?.completed)).toBe(true);
  }
  async function assertDashboard() {
    await expect(page.locator('[data-widget="continue"]')).toContainText("4 of 4 live topics completed");
    for(const meta of fishPath.topics.filter(t=>t.status==="live"))await expect(page.locator('[data-widget="progress"]')).toContainText(meta.title);
    for(const lab of labs)await expect(page.locator('[data-widget="labs"]').getByRole("heading",{name:lab.title,exact:true}).locator("..")).toContainText("Completed · Score: 100 / 100");
    expect(Number(await page.locator('[data-widget="streak"] .ov-dashboard-bigNumber').innerText().then(t=>t.match(/\d+/)![0]))).toBeGreaterThanOrEqual(1);
    const expected=badgesJson.badges.filter(b=>["first-topic-started","topic-complete","all-live-topics"].includes(b.rule.type)||labs.some(l=>l.badge===b.id));
    for(const badge of expected)await expect(page.locator('[data-widget="badges"] [data-earned=true]').filter({hasText:badge.label})).toBeVisible();
  }
  await page.goto("/dashboard");await assertDashboard();await page.screenshot({path:`${directory}/${info.project.name}-dashboard.png`,scale:"css",style:".ov-badge-toasts{visibility:hidden}"});
  await page.getByRole("button",{name:"Customize",exact:true}).click();await page.getByRole("checkbox",{name:"Learning activity",exact:true}).uncheck();await page.getByRole("button",{name:"Move Your labs up",exact:true}).click();await expect(page.getByRole("status").filter({hasText:"Layout saved"})).toBeVisible();await page.getByRole("button",{name:"Done customizing",exact:true}).click();const layout=await(await page.request.get("/api/me/dashboard")).json();
  const themeSaved=page.waitForResponse(r=>r.url().endsWith("/api/me/theme")&&r.request().method()==="PUT");await page.getByRole("button",{name:"Toggle colour theme",exact:true}).click();expect((await themeSaved).ok()).toBe(true);await expect(page.locator("html")).toHaveAttribute("data-theme","dark");
  await page.getByRole("button",{name:"Account menu",exact:true}).click();await page.getByRole("button",{name:"Sign out",exact:true}).click();await expect(page).toHaveURL("/");await page.goto("/signin");await page.getByLabel("Email",{exact:true}).fill(email);await page.getByLabel("Password",{exact:true}).fill(password);await page.getByRole("button",{name:"Sign in",exact:true}).click();await expect(page).toHaveURL("/dashboard");await assertDashboard();
  expect(await(await page.request.get("/api/me/dashboard")).json()).toEqual(layout);await expect(page.locator('[data-widget="activity-chart"]')).toHaveCount(0);await expect(page.locator("html")).toHaveAttribute("data-theme","dark");await page.reload();await expect(page.locator("html")).toHaveAttribute("data-theme","dark");await assertDashboard();
  await writeFile(`${directory}/${info.project.name}-journey.json`,JSON.stringify({topicsCompleted:4,labsCompleted:labs.map(l=>l.id),layoutRestored:true,themeRestored:true,accountMerge:true,returnRestored:true},null,2));
});
