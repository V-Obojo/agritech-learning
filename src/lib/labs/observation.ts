import {z} from "zod";
import type {ObservationLab,Scene} from "./definitions";
export function evaluateTap(scene:Scene,id:string,taps:string[]) {
  const element=scene.elements.find(e=>e.id===id);if(!element)return {kind:"unknown" as const,element:undefined,taps};
  return {kind:element.isSign?"sign" as const:"neutral" as const,element,taps:[...new Set([...taps,id])]};
}
export function sceneScore(scene:Scene,taps:string[]) {
  const picked=new Set(taps),signs=scene.elements.filter(e=>e.isSign),found=signs.filter(e=>picked.has(e.id)).length,wrong=scene.elements.filter(e=>!e.isSign&&picked.has(e.id)).length;
  return {found,total:signs.length,wrong,score:signs.length?Math.round(Math.max(0,found-wrong)/signs.length*100):0,completed:signs.length>0&&found===signs.length};
}
export function overallScore(lab:ObservationLab,taps:Record<string,string[]>) {const scores=lab.scenes.map(s=>sceneScore(s,taps[s.id]??[])),total=scores.reduce((n,s)=>n+s.total,0),points=scores.reduce((n,s)=>n+Math.max(0,s.found-s.wrong),0);return total?Math.round(points/total*100):0;}
const stateSchema=z.object({sceneId:z.string(),taps:z.record(z.string(),z.array(z.string())),summary:z.boolean()});
export type ObservationState=z.infer<typeof stateSchema>;
export function observationState(lab:ObservationLab,value:unknown):ObservationState {
  const p=stateSchema.safeParse(value);if(!p.success)return {sceneId:lab.scenes[0].id,taps:{},summary:false};
  return {sceneId:lab.scenes.some(s=>s.id===p.data.sceneId)?p.data.sceneId:lab.scenes[0].id,summary:p.data.summary,taps:Object.fromEntries(lab.scenes.map(s=>[s.id,[...new Set((p.data.taps[s.id]??[]).filter(id=>s.elements.some(e=>e.id===id)))]]))};
}
export function observationCompletion(lab:ObservationLab,state:ObservationState) {const valid=observationState(lab,state),done=Math.min(lab.scenes.filter(s=>sceneScore(s,valid.taps[s.id]??[]).completed).length,lab.completion.scenesDone),total=lab.completion.scenesDone;return {done,total,completed:done===total,score:overallScore(lab,valid.taps)};}
