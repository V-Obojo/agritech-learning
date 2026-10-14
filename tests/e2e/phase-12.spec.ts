import {mkdir,writeFile} from "node:fs/promises";
import {randomUUID} from "node:crypto";
import {test,expect,topicData,firstTopic,hubUrl,fishPath,askGuide,closeGuide,submitActivity} from "./fixtures";
import labsJson from "../../content/labs.json";
import mediaJson from "../../content/media.json";
import sourcesJson from "../../content/sources.json";
const lab=labsJson.labs.find(l=>l.type==="model-viewer")!;
const topic=topicData(lab.topicId),directory="test-results/phase-12";
const frame=(page:import("@playwright/test").Page)=>page.locator(`[data-lab-id="${lab.id}"]`);

test("Phase 12: credited figure, zoom, rotation, pan, reset, keyboard focus and Escape",async({page},info)=>{
  await page.goto(topic.url);const figure=page.locator(".lesson-figure").first(),media=mediaJson.media[0];await expect(figure).toContainText(`Photo: ${media.credit} · ${media.license}`);
  const trigger=figure.getByRole("button",{name:/Enlarge image:/});await trigger.click();const dialog=page.getByRole("dialog",{name:"Image viewer"});await expect(dialog).toBeVisible();
  const image=dialog.getByTestId("lightbox-image"),initial=await image.getAttribute("style");await dialog.getByRole("button",{name:"Zoom in",exact:true}).click();await dialog.getByRole("button",{name:"Rotate right",exact:true}).click();expect(await image.getAttribute("style")).not.toBe(initial);await expect(image).toHaveAttribute("style",/rotate\(90deg\).*scale\(1.2\)/);
  const rotationToggle=dialog.getByRole("button",{name:"Adjust rotation",exact:true});if(await rotationToggle.isVisible())await rotationToggle.click();await dialog.getByLabel("Free rotation").focus();await page.keyboard.press("ArrowLeft");await expect(image).toHaveAttribute("style",/rotate\(89deg\)/);await dialog.getByRole("button",{name:"Zoom in",exact:true}).focus();await page.keyboard.press("ArrowRight");await expect(image).toHaveAttribute("style",/translate\(30px/);await page.keyboard.press("r");expect(await image.getAttribute("style")).toBe(initial);
  // Native modal focus cannot escape into the lesson.
  for(let i=0;i<12;i++) await page.keyboard.press("Tab");expect(await dialog.evaluate(d=>d.contains(document.activeElement))).toBe(true);
  await mkdir(directory,{recursive:true});await page.screenshot({path:`${directory}/${info.project.name}-lightbox.png`});await page.keyboard.press("Escape");await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();
});

test("Phase 12: procedural canvas, camera orbit, citations, modes, guest completion and screenshots",async({page},info)=>{
  await page.emulateMedia({reducedMotion:"reduce"});await page.goto(topic.url);const region=frame(page);await region.scrollIntoViewIfNeeded();await expect(region.locator("canvas")).toBeVisible();
  const dismiss=page.getByRole("button",{name:/^Dismiss .* badge$/});
  while(await dismiss.count())await dismiss.first().click();
  await expect.poll(async()=>Number(await region.locator(".model-canvas").getAttribute("data-rendered-triangles"))).toBeGreaterThan(0);
  const host=region.locator(".model-canvas");await host.scrollIntoViewIfNeeded();const before=await host.getAttribute("data-camera-azimuth"),box=await host.boundingBox();expect(box).toBeTruthy();await page.mouse.move(box!.x+box!.width*.5,box!.y+box!.height*.5);await page.mouse.down();await page.mouse.move(box!.x+box!.width*.75,box!.y+box!.height*.6,{steps:12});await page.mouse.up();await expect.poll(()=>host.getAttribute("data-camera-azimuth")).not.toBe(before);
  await region.getByRole("button",{name:"Side view",exact:true}).click();await expect(region.getByRole("button",{name:"Auto-rotate",exact:true})).toBeDisabled();
  await region.locator(".hotspot-list").getByRole("button",{name:lab.hotspots![0].label,exact:true}).click();const card=region.locator(".hotspot-card");await expect(card).toContainText(lab.hotspots![0].text);await expect(card.getByRole("link",{name:"mc-02",exact:true})).toHaveAttribute("href","#mc-02");
  await expect(region.locator(".hotspot-list button").last()).toHaveCSS("color","rgb(32, 57, 46)");
  await region.getByRole("button",{name:"Side view",exact:true}).click();await expect.poll(async()=>Number(await host.getAttribute("data-camera-distance"))).toBeGreaterThan(page.viewportSize()!.width<640?10:7);await mkdir(directory,{recursive:true});await region.screenshot({path:`${directory}/${info.project.name}-adult.png`,style:".site-header,.skip-link,.ov-badge-toasts{visibility:hidden}"});
  await region.getByRole("button",{name:lab.modes![1].label,exact:true}).click();await expect(region.locator(".mode-note")).toContainText(lab.modes![1].note.replace(/\s*\([a-z]+-\d+\)/g,""));await region.screenshot({path:`${directory}/${info.project.name}-fingerling.png`,style:".site-header,.skip-link,.ov-badge-toasts{visibility:hidden}"});
  for(const h of lab.hotspots!.slice(1,5)) await region.locator(".hotspot-list").getByRole("button",{name:h.label,exact:true}).click();await expect(region.locator(".lab-completed")).toContainText("Completed!");
  await expect.poll(()=>page.evaluate(id=>Boolean(JSON.parse(localStorage.getItem("agri-progress-v2")||"{}").labs?.[id]?.completed),lab.id)).toBe(true);
  const events=await page.evaluate(()=>JSON.parse(localStorage.getItem("agri-events-v1")||"[]"));for(const name of ["lab_started","lab_progress","lab_completed"]) expect(events.some((e:{name:string;details:Record<string,string>})=>e.name===name&&e.details.labId===lab.id&&e.details.topicId===lab.topicId&&e.details.subjectId===lab.subjectId)).toBe(true);
  expect(events.filter((e:{name:string})=>e.name==="lab_completed")).toHaveLength(1);const triangles=Number(await region.locator("[data-triangles]").getAttribute("data-triangles"));expect(triangles).toBeLessThan(20000);
  for(const width of [375,768,1280,1440]){await page.setViewportSize({width,height:900});expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);}
  await page.reload();await expect(frame(page).locator(".lab-completed")).toContainText("Completed!");await page.goto("/labs");await expect(page.locator(`[data-lab-card="${lab.id}"]`)).toContainText("Completed ✓");
  await writeFile(`${directory}/${info.project.name}-model.json`,JSON.stringify({triangles,completed:true,visited:5,modes:2},null,2));
});

test("Phase 12: teaser gallery, lesson anchor, full credits and topic-two mock learning loop",async({page})=>{
  await page.goto("/labs");await expect(page.locator("[data-lab-card]")).toHaveCount(4);await expect(page.locator("canvas")).toHaveCount(0);await expect(page.getByText("Coming in a later update",{exact:true})).toHaveCount(0);
  await page.locator(`[data-lab-card="${lab.id}"]`).getByRole("link",{name:"Open in lesson",exact:true}).click();await expect(page).toHaveURL(`${topic.url}#mc-02`);await expect(frame(page)).toBeVisible();
  await expect(page.getByRole("link",{name:`Previous topic: ${firstTopic.meta.title}`,exact:true})).toHaveAttribute("href",firstTopic.url);
  await expect(page.getByRole("link",{name:`Next topic: ${topicData(fishPath.topics.find(t=>t.order===topic.meta.order+1)!.slug).meta.title}`,exact:true})).toHaveAttribute("href",topicData(fishPath.topics.find(t=>t.order===topic.meta.order+1)!.slug).url);
  await askGuide(page,"How do barbels help the fish find food?","mc-02");await closeGuide(page);await page.goto(`${topic.url}/activity`);const path=topic.activity.paths[0];const result=await submitActivity(page,path.id,path.example??path.scenario!,topic);expect(result.mode).toBe("mock");expect(result.completed).toBe(true);
  await page.goto(`${topic.url}/next`);const next=fishPath.topics.find(t=>t.order===topic.meta.order+1)!;await expect(page.getByRole("link",{name:`Next topic: ${next.title}`,exact:true})).toHaveAttribute("href",topicData(next.slug).url);
  await page.goto(hubUrl);await expect(page.locator(".topic-path a.topic-card")).toHaveCount(4);
  await page.goto("/credits");await expect(page.locator("main .lesson-figure")).toHaveCount(10);for(const media of mediaJson.media){const f=page.locator(`[data-media-id="${media.id}"]`);await expect(f).toContainText(media.caption);await expect(f).toContainText(media.credit);await expect(f.locator(`a[href="${media.sourceUrl}"]`)).toHaveCount(1);}
  for(const source of sourcesJson.sources) await expect(page.getByRole("link",{name:source.title,exact:true})).toHaveAttribute("href",source.url);await expect(page.locator("footer").getByRole("link",{name:"Credits",exact:true})).toHaveAttribute("href","/credits");
});

test("Phase 12: three and r3f are absent from home/topic-one requests",async({page},info)=>{
  const scripts:string[]=[];page.on("request",r=>{if(new URL(r.url()).pathname.endsWith(".js"))scripts.push(r.url());});
  const read=async(urls:string[])=>Promise.all([...new Set(urls)].map(async url=>({url,body:await(await page.request.get(url)).text()})));
  const isEngine=(body:string)=>body.includes("THREE.WebGLRenderer")||body.includes("R3F:")||body.includes("react-three-fiber");
  await page.goto("/");await expect(page.locator(".hero")).toBeVisible();const homeUrls=[...scripts];await page.goto(firstTopic.url);await expect(page.getByRole("article")).toBeVisible();const light=await read(scripts);expect(light.length).toBeGreaterThan(0);expect(light.filter(s=>isEngine(s.body))).toEqual([]);
  scripts.length=0;await page.goto(topic.url);await frame(page).scrollIntoViewIfNeeded();await expect(frame(page).locator("canvas")).toBeVisible();const heavy=await read(scripts),engines=heavy.filter(s=>isEngine(s.body));expect(engines.length).toBeGreaterThan(0);expect(engines.every(s=>!light.some(l=>l.url===s.url))).toBe(true);
  await mkdir(directory,{recursive:true});await writeFile(`${directory}/${info.project.name}-network.json`,JSON.stringify({home:[...new Set(homeUrls)],homeAndTopicOne:light.map(s=>s.url),engineChunks:engines.map(s=>s.url),engineAbsentOnHomeAndTopicOne:true},null,2));
});

test("Phase 12: WebGL fallback exposes credited drawing and equivalent completion",async({page})=>{
  await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(this:HTMLCanvasElement,type:string,...args:unknown[]){if(type.startsWith("webgl"))return null;return Reflect.apply(original,this,[type,...args]);} as typeof original;});
  await page.goto(topic.url);const region=frame(page);await expect(region.locator(".model-fallback")).toBeVisible();await expect(region.locator("canvas")).toHaveCount(0);await expect(region.locator('[data-media-id="catfish-drawing"]')).toContainText("Public domain");await expect(region.locator(".fallback-marker")).toHaveCount(lab.hotspots!.length);
  for(const h of lab.hotspots!.slice(0,5))await region.locator(".hotspot-list").getByRole("button",{name:h.label,exact:true}).click();await region.getByRole("button",{name:lab.modes![1].label,exact:true}).click();await expect(region.locator(".lab-completed")).toContainText("Completed!");
});

test("Phase 12: account lab completion saves through authenticated progress API",async({page})=>{
  await page.goto("/signup");await page.getByLabel("Name",{exact:true}).fill("Lab Learner");await page.getByLabel("Email",{exact:true}).fill(`lab-${randomUUID()}@example.test`);await page.getByLabel("Password",{exact:true}).fill("LabFixture12");await page.getByRole("button",{name:"Create account",exact:true}).click();await expect(page).toHaveURL("/dashboard");
  await page.goto(topic.url);const region=frame(page);await expect(region.locator("canvas")).toBeVisible();for(const h of lab.hotspots!.slice(0,5)) await region.locator(".hotspot-list").getByRole("button",{name:h.label,exact:true}).click();await region.getByRole("button",{name:lab.modes![1].label,exact:true}).click();await expect(region.locator(".lab-completed")).toContainText("Completed!");
  await expect.poll(async()=>Boolean((await(await page.request.get("/api/me/progress")).json()).labs?.[lab.id]?.completed)).toBe(true);await page.reload();await expect(frame(page).locator(".lab-completed")).toContainText("Completed!");
});
