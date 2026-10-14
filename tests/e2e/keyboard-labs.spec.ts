import type {Page,Locator} from "@playwright/test";
import {test,expect,topicData} from "./fixtures";
import {labs,labFrame} from "./lab-actions";
import {waterSchema,observationSchema} from "../../src/lib/labs/definitions";
// Reach controls through the real Tab order, never programmatic focus or mouse/touch.
async function reach(page:Page,target:Locator) {
  for(let i=0;i<180;i++){if(await target.evaluate(e=>e===document.activeElement))return;await page.keyboard.press("Tab");}
  throw new Error("Control is unreachable in the keyboard Tab order");
}
async function press(page:Page,target:Locator,key="Enter") {await reach(page,target);await expect(target).toBeFocused();await expect(target).toHaveCSS("outline-style","solid");await page.keyboard.press(key);}
test("keyboard alone: pond inputs, resize/depth sliders and completion",async({page})=>{
  test.setTimeout(120000);await page.emulateMedia({reducedMotion:"reduce"});const lab=labs.find(l=>l.type==="pond-builder")!;await page.goto(topicData(lab.topicId).url);const frame=labFrame(page,lab.id);await expect(frame.getByLabel("Length (m)",{exact:true})).toBeEnabled();
  for(const side of [20,17.5])for(const label of ["Length (m)","Width (m)"]){const input=frame.getByLabel(label,{exact:true});await reach(page,input);await page.keyboard.press("ControlOrMeta+A");await page.keyboard.type(String(side));await page.keyboard.press("Tab");}
  await expect(frame.locator(".lab-completed")).toContainText("Completed!");const width=frame.getByRole("slider",{name:"Resize pond width",exact:true});await press(page,width,"ArrowRight");await expect(frame.getByLabel("Width (m)",{exact:true})).toHaveValue("18");
  await press(page,frame.getByRole("slider",{name:"Drag depth stick",exact:true}),"End");await expect(frame.getByLabel("Depth (m)",{exact:true})).toHaveValue("2");await expect(frame.getByTestId("pond-area").locator("..").locator("..")).toHaveAttribute("aria-live","polite");
});
test("keyboard alone: observation SVG signs, explanations and results",async({page})=>{
  test.setTimeout(120000);await page.emulateMedia({reducedMotion:"reduce"});const lab=labs.find(l=>l.type==="observation")!,config=observationSchema.parse(lab);await page.goto(topicData(lab.topicId).url);const frame=labFrame(page,lab.id);await expect(frame.locator(".observation-canvas")).toBeVisible();
  for(const scene of config.scenes){await press(page,frame.locator(".observation-stepper button").filter({hasText:scene.title}));for(const sign of scene.elements.filter(e=>e.isSign)){await press(page,frame.locator(`.observation-canvas [data-element-id="${sign.id}"]`),"Space");await expect(frame.locator(".observation-feedback")).toContainText(sign.explain);}}
  await press(page,frame.getByRole("button",{name:"See results",exact:true}));await expect(frame.getByTestId("overall-score")).toContainText("100 / 100");await expect(frame.locator(".lab-completed")).toContainText("Completed!");
});
test("keyboard alone: model list/modes/camera and water sources/year/questions",async({page})=>{
  test.setTimeout(120000);await page.emulateMedia({reducedMotion:"reduce"});const model=labs.find(l=>l.type==="model-viewer")!;await page.goto(topicData(model.topicId).url);let frame=labFrame(page,model.id);await expect(frame.locator("canvas")).toBeVisible();
  for(const h of model.hotspots!.slice(0,model.completion.hotspotsVisited!))await press(page,frame.locator(".hotspot-list").getByRole("button",{name:h.label,exact:true}));await press(page,frame.getByRole("button",{name:model.modes![1].label,exact:true}));await press(page,frame.getByRole("button",{name:"Top view",exact:true}));await press(page,frame.getByRole("button",{name:"Zoom in model",exact:true}));await expect(frame.locator(".lab-completed")).toContainText("Completed!");
  const lab=labs.find(l=>l.type==="water-simulator")!,config=waterSchema.parse(lab);await page.goto(topicData(lab.topicId).url);frame=labFrame(page,lab.id);await expect(frame.locator(".sim-source-grid")).toBeVisible();for(const source of config.sources.slice(0,config.completion.sourcesExplored))await press(page,frame.getByRole("button",{name:source.label,exact:true}));await press(page,frame.getByRole("slider",{name:"Year month",exact:true}),"End");
  for(const q of config.questions){const group=frame.getByRole("group",{name:q.prompt,exact:true}),options=group.getByRole("radio"),answer=group.getByRole("radio",{name:config.sources.find(s=>s.id===q.answer)?.label??q.answer,exact:true});await press(page,options.first(),"Space");for(let i=0;i<await options.count();i++){if(await answer.evaluate(e=>e===document.activeElement))break;await page.keyboard.press("ArrowRight");}await expect(answer).toBeChecked();}await expect(frame.locator(".lab-completed")).toContainText("Completed!");
});
