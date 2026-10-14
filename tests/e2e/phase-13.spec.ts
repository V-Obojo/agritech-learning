import {mkdir,writeFile} from "node:fs/promises";
import {randomUUID} from "node:crypto";
import type {Page,TestInfo} from "@playwright/test";
import {test,expect,topicData,hubUrl,fishPath,askGuide,closeGuide,submitActivity} from "./fixtures";
import labsJson from "../../content/labs.json";
import badgesJson from "../../content/badges.json";
import {waterSchema,pondSchema,observationSchema} from "../../src/lib/labs/definitions";
const water=waterSchema.parse(labsJson.labs.find(l=>l.type==="water-simulator")),pond=pondSchema.parse(labsJson.labs.find(l=>l.type==="pond-builder")),observation=observationSchema.parse(labsJson.labs.find(l=>l.type==="observation"));
const directory="test-results/phase-13",screenshotStyle=".site-header,.skip-link,.ov-badge-toasts,.guide-trigger{visibility:hidden}";
const frame=(page:Page,id:string)=>page.locator(`[data-lab-id="${id}"]`);
async function picture(page:Page,info:TestInfo,id:string,name:string) {await mkdir(directory,{recursive:true});await frame(page,id).screenshot({path:`${directory}/${info.project.name}-${name}.png`,style:screenshotStyle});}
async function completed(page:Page,id:string) {await expect(frame(page,id).locator(".lab-completed")).toContainText("Completed!");}
async function finishWater(page:Page) {
  const region=frame(page,water.id);await expect(region.locator('[data-simulator="water-simulator"]')).toBeVisible();
  for(const source of water.sources.slice(0,water.completion.sourcesExplored))await region.getByRole("button",{name:source.label,exact:true}).click();
  for(const question of water.questions){const label=water.sources.find(s=>s.id===question.answer)?.label??question.answer;await region.getByRole("group",{name:question.prompt,exact:true}).getByRole("radio",{name:label,exact:true}).check();}
  await completed(page,water.id);
}
async function finishPond(page:Page) {
  const region=frame(page,pond.id);await expect(region.locator('[data-simulator="pond-builder"]')).toBeVisible();
  await region.getByLabel("Length (m)",{exact:true}).fill("20");await region.getByLabel("Width (m)",{exact:true}).fill("20");await expect(region.getByTestId("pond-area")).toContainText("400 m²");
  await region.getByLabel("Length (m)",{exact:true}).fill("17.5");await region.getByLabel("Width (m)",{exact:true}).fill("17.5");await completed(page,pond.id);
}
async function finishObservation(page:Page,touch=false,wrong=false) {
  const region=frame(page,observation.id);await expect(region.locator('[data-simulator="observation"]')).toBeVisible();
  for(const scene of observation.scenes){await region.locator(".observation-stepper button").filter({hasText:scene.title}).click();
    if(wrong&&scene===observation.scenes[0]){const neutral=scene.elements.find(e=>!e.isSign)!;await region.locator(".observation-items").getByRole("button",{name:neutral.label,exact:true}).click();await expect(region.locator('[data-kind="neutral"]')).toContainText(neutral.explain);}
    for(const element of scene.elements.filter(e=>e.isSign)){const target=region.locator(`.observation-canvas [data-element-id="${element.id}"]`);if(touch)await target.tap();else await target.click();await expect(region.locator(".observation-feedback")).toContainText(element.explain);await expect(region.locator(".observation-feedback").getByRole("link",{name:element.chunk!,exact:true})).toHaveAttribute("href",`#${element.chunk}`);}
    await expect(region.getByTestId("scene-score")).toContainText(`Found ${scene.elements.filter(e=>e.isSign).length} of ${scene.elements.filter(e=>e.isSign).length} signs`);
  }
  await completed(page,observation.id);await region.getByRole("button",{name:"See results",exact:true}).click();await expect(region.getByTestId("overall-score")).toContainText(wrong?"80 / 100":"100 / 100");await expect(region.locator(".observation-summary")).toContainText(observation.remedy.text);
}
async function guestSaved(page:Page,id:string) {await expect.poll(()=>page.evaluate(id=>Boolean(JSON.parse(localStorage.getItem("agri-progress-v2")??"{}").labs?.[id]?.completed),id)).toBe(true);}
async function dragWidth(page:Page,touch:boolean) {
  const handle=frame(page,pond.id).getByRole("slider",{name:"Resize pond width",exact:true});
  await handle.scrollIntoViewIfNeeded();const box=await handle.boundingBox();expect(box).toBeTruthy();
  const x=box!.x+box!.width/2,y=box!.y+box!.height/2;
  if(touch) {
    const session=await page.context().newCDPSession(page);
    await session.send("Input.dispatchTouchEvent",{type:"touchStart",touchPoints:[{x,y}]});
    for(let step=1;step<=8;step++)await session.send("Input.dispatchTouchEvent",{type:"touchMove",touchPoints:[{x:x-28*step/8,y}]});
    await session.send("Input.dispatchTouchEvent",{type:"touchEnd",touchPoints:[]});await session.detach();
  } else {
    await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-28,y,{steps:8});await page.mouse.up();
  }
  return handle;
}

test("Phase 13: water year, dry shortfall, sources, cited questions, completion and reload",async({page},info)=>{
  await page.goto(topicData(water.topicId).url);const region=frame(page,water.id);await expect(region.getByRole("button",{name:water.sources[0].label,exact:true})).toBeEnabled();await region.getByRole("button",{name:water.sources[0].label,exact:true}).click();const slider=region.getByRole("slider",{name:"Year month",exact:true});await slider.focus();await page.keyboard.press("Home");await page.keyboard.press("ArrowRight");await page.keyboard.press("ArrowRight");await expect(region.locator(".sim-shortfall")).toContainText(`65 ${water.pondNeed.unit}`);await expect(region).toContainText(water.exampleNote.replace(/\s*\([a-z]+-\d+\)/g,""));
  await expect(region.locator(".sim-photo")).toHaveCount(water.sources.filter(s=>s.media).length);for(const photo of await region.locator(".sim-photo").all())await expect(photo.locator(".media-credit")).toContainText("Photo:");
  const month=await region.getByTestId("current-month").innerText();await region.getByRole("button",{name:"Play year",exact:true}).click();await expect.poll(()=>region.getByTestId("current-month").innerText()).not.toBe(month);await region.getByRole("button",{name:"Pause year",exact:true}).click();await page.emulateMedia({reducedMotion:"reduce"});await expect(region.getByRole("button",{name:"Play year",exact:true})).toBeDisabled();
  await slider.focus();await page.keyboard.press("Home");await picture(page,info,water.id,"water-shortfall");await finishWater(page);await guestSaved(page,water.id);await picture(page,info,water.id,"water-completed");await page.reload();await completed(page,water.id);
});

test("Phase 13: pond tape, drag, depth, references, setup photos, challenges and saved measurements",async({page},info)=>{
  await page.emulateMedia({reducedMotion:"reduce"});await page.goto(topicData(pond.topicId).url);const region=frame(page,pond.id);await expect(region.getByLabel("Length (m)",{exact:true})).toBeEnabled();await region.getByLabel("Length (m)",{exact:true}).fill("20");await region.getByLabel("Width (m)",{exact:true}).fill("20");await expect(region.getByTestId("pond-area")).toHaveText("400 m²");await expect(region.getByTestId("pond-volume")).toHaveText("400 m³");await expect(region.getByTestId("pond-litres")).toHaveText("400,000 L");await expect(region.locator(`[data-challenge-id="${pond.challenges[0].id}"]`)).toContainText("✓ Current dimensions match");await expect(region).toContainText(pond.math);
  for(const reference of pond.references){await expect(region).toContainText(reference.label);await expect(region.locator(".pond-references").getByRole("link",{name:reference.chunk,exact:true}).first()).toHaveAttribute("href",`#${reference.chunk}`);}
  await picture(page,info,pond.id,"pond-example");const handle=await dragWidth(page,Boolean(info.project.use.hasTouch));await expect(region.getByLabel("Width (m)",{exact:true})).not.toHaveValue("20");const before=Number(await region.getByLabel("Width (m)",{exact:true}).inputValue());await handle.focus();await page.keyboard.press("ArrowRight");await expect(region.getByLabel("Width (m)",{exact:true})).toHaveValue(String(before+pond.limits.step));
  const depth=region.getByRole("slider",{name:"Drag depth stick",exact:true});await depth.focus();await page.keyboard.press("Home");await expect(region.getByLabel("Depth (m)",{exact:true})).toHaveValue(String(pond.limits.minDepth));await page.keyboard.press("End");await expect(region.getByLabel("Depth (m)",{exact:true})).toHaveValue(String(pond.limits.maxDepth));
  for(const [index,setup] of pond.setupTypes.entries()){await region.getByRole("button",{name:setup.label,exact:true}).click();await expect(region.locator(".pond-builder")).toHaveAttribute("data-setup-index",String(index));await expect(region).toContainText(setup.text);await expect(region.locator(".sim-photo .media-credit")).toContainText("Photo:");}
  await finishPond(page);await guestSaved(page,pond.id);await picture(page,info,pond.id,"pond-completed");await page.reload();await completed(page,pond.id);await expect(frame(page,pond.id).getByLabel("Length (m)",{exact:true})).toHaveValue("17.5");
});

test("Phase 13: illustrated signs, neutral wrong tap, scored scenes, remedy and saved completion",async({page},info)=>{
  await page.emulateMedia({reducedMotion:"reduce"});await page.goto(topicData(observation.topicId).url);await finishObservation(page,Boolean(info.project.use.hasTouch),true);await guestSaved(page,observation.id);await picture(page,info,observation.id,"observation-results");await frame(page,observation.id).getByRole("button",{name:"Back to scenes",exact:true}).click();await picture(page,info,observation.id,"observation-scene");await page.reload();await completed(page,observation.id);await expect.poll(()=>page.evaluate(id=>JSON.parse(localStorage.getItem("agri-progress-v2")??"{}").labs?.[id]?.score,observation.id)).toBe(80);
});

test("Phase 13: account saves all four labs, earns badges and shows dashboard/gallery results",async({page},info)=>{
  test.setTimeout(120000);await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/signup");await page.getByLabel("Name",{exact:true}).fill("Hands-on Learner");await page.getByLabel("Email",{exact:true}).fill(`simulators-${randomUUID()}@example.test`);await page.getByLabel("Password",{exact:true}).fill("SimulatorFixture12");await page.getByRole("button",{name:"Create account",exact:true}).click();await expect(page).toHaveURL("/dashboard");
  const model=labsJson.labs.find(l=>l.type==="model-viewer")!;await page.goto(topicData(model.topicId).url);const modelFrame=frame(page,model.id);await expect(modelFrame.locator("canvas")).toBeVisible();for(const hotspot of model.hotspots!.slice(0,model.completion.hotspotsVisited!)){const button=modelFrame.locator(".hotspot-list").getByRole("button",{name:hotspot.label,exact:true});await button.evaluate(e=>e.scrollIntoView({block:"center"}));await button.click();}await modelFrame.getByRole("button",{name:model.modes![1].label,exact:true}).click();await completed(page,model.id);
  await expect.poll(async()=>Boolean((await(await page.request.get("/api/me/progress")).json()).labs?.[model.id]?.completed)).toBe(true);
  await page.goto(topicData(water.topicId).url);await finishWater(page);await finishObservation(page,Boolean(info.project.use.hasTouch));await expect.poll(async()=>{const p=await(await page.request.get("/api/me/progress")).json();return Boolean(p.labs?.[water.id]?.completed&&p.labs?.[observation.id]?.completed);}).toBe(true);await page.goto(topicData(pond.topicId).url);await finishPond(page);
  await expect.poll(async()=>{const p=await(await page.request.get("/api/me/progress")).json();return labsJson.labs.every(l=>p.labs?.[l.id]?.completed);}).toBe(true);await page.goto("/dashboard");const widget=page.locator('[data-widget="labs"]');for(const lab of labsJson.labs){const row=widget.getByRole("heading",{name:lab.title,exact:true}).locator("..");await expect(row).toContainText("Completed · Score: 100 / 100");await expect(row.getByRole("link",{name:"Open lab →",exact:true})).toHaveAttribute("href",`${topicData(lab.topicId).url}#${lab.id}`);const badge=badgesJson.badges.find(b=>b.id===lab.badge)!;await expect(page.locator('[data-widget="badges"] [data-earned="true"]').filter({hasText:badge.label})).toBeVisible();}
  await mkdir(directory,{recursive:true});await page.screenshot({path:`${directory}/${info.project.name}-dashboard-labs.png`,fullPage:true,style:screenshotStyle});await page.goto("/labs");await expect(page.locator("[data-lab-card]")).toHaveCount(4);await expect(page.getByText("Completed ✓",{exact:true})).toHaveCount(4);await expect(page.getByText("Coming in a later update",{exact:true})).toHaveCount(0);await expect(page.locator("[data-preview]")).toHaveCount(4);await expect(page.locator("canvas")).toHaveCount(0);
  await page.reload();await expect(page.getByText("Completed ✓",{exact:true})).toHaveCount(4);await writeFile(`${directory}/${info.project.name}-account.json`,JSON.stringify({labsCompleted:labsJson.labs.map(l=>l.id),badgesEarned:labsJson.labs.map(l=>l.badge),scores:100},null,2));
});

test("Phase 13: topic four mock loop, live hub, all lesson links and responsive labs",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});const topic=topicData(pond.topicId);await page.goto(topic.url);await askGuide(page,"What size does FAO suggest for a first pond?","so-03");await closeGuide(page);await page.goto(`${topic.url}/activity`);const path=topic.activity.paths[0];const result=await submitActivity(page,path.id,path.example!,topic);expect(result.completed).toBe(true);await page.goto(hubUrl);await expect(page.locator(".topic-path > li")).toHaveCount(5);await expect(page.locator(".topic-path a.topic-card")).toHaveCount(4);
  await page.goto("/labs");for(const lab of labsJson.labs){await page.locator(`[data-lab-card="${lab.id}"]`).getByRole("link",{name:"Open in lesson",exact:true}).click();await expect(frame(page,lab.id)).toBeVisible();await page.goto("/labs");}
  for(const width of [375,768,1280,1440]){await page.setViewportSize({width,height:900});for(const id of [water.topicId,pond.topicId]){await page.goto(topicData(id).url);await expect(page.getByRole("article")).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);}}
  expect(fishPath.topics.filter(t=>t.status==="live")).toHaveLength(4);
});
