import type {Page} from "@playwright/test";
import {expect,topicData} from "./fixtures";
import labsJson from "../../content/labs.json";
import {waterSchema,pondSchema,observationSchema} from "../../src/lib/labs/definitions";
export const labs=labsJson.labs;
export const labFrame=(page:Page,id:string)=>page.locator(`[data-lab-id="${id}"]`);
export async function completeLabs(page:Page,topicId:string) {
  for(const lab of labs.filter(l=>l.topicId===topicId)) {
    const region=labFrame(page,lab.id);
    if(lab.type==="model-viewer") {
      await expect(region.locator("canvas")).toBeVisible({timeout:15000});
      for(const h of lab.hotspots!.slice(0,lab.completion.hotspotsVisited!))await region.locator(".hotspot-list").getByRole("button",{name:h.label,exact:true}).click();
      await region.getByRole("button",{name:lab.modes![1].label,exact:true}).click();
    } else if(lab.type==="water-simulator") {
      const config=waterSchema.parse(lab);
      for(const source of config.sources.slice(0,config.completion.sourcesExplored))await region.getByRole("button",{name:source.label,exact:true}).click();
      for(const q of config.questions)await region.getByRole("group",{name:q.prompt,exact:true}).getByRole("radio",{name:config.sources.find(s=>s.id===q.answer)?.label??q.answer,exact:true}).check();
    } else if(lab.type==="pond-builder") {
      const config=pondSchema.parse(lab);await expect(region.getByLabel("Length (m)",{exact:true})).toBeEnabled();
      for(const side of [20,17.5]){await region.getByLabel("Length (m)",{exact:true}).fill(String(side));await region.getByLabel("Width (m)",{exact:true}).fill(String(side));}
      expect(config.completion.challengesDone).toBe(2);
    } else {
      const config=observationSchema.parse(lab);
      for(const scene of config.scenes){await region.locator(".observation-stepper button").filter({hasText:scene.title}).click();for(const sign of scene.elements.filter(e=>e.isSign))await region.locator(".observation-items").getByRole("button",{name:sign.label,exact:true}).click();}
    }
    await expect(region.locator(".lab-completed")).toContainText("Completed!");
  }
}
export async function accountLabsSaved(page:Page,topicId:string) {
  await expect.poll(async()=>{const p=await(await page.request.get("/api/me/progress")).json();return labs.filter(l=>l.topicId===topicId).every(l=>p.labs?.[l.id]?.completed);}).toBe(true);
}
export function labTopic(type:string) {return topicData(labs.find(l=>l.type===type)!.topicId);}
