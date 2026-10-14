import {z} from "zod";
import type {WaterLab} from "./definitions";
export function shortfallByMonth(lab:WaterLab,sourceId:string) {
  const source=lab.sources.find(s=>s.id===sourceId);if(!source) throw new Error("Unknown water source");
  return lab.months.map((month,index)=>{const supply=source.levels[index],need=lab.pondNeed[month.season];return {...month,index,supply,need,shortfall:Math.max(0,need-supply)};});
}
export function worstMonth(lab:WaterLab,sourceId:string) {return shortfallByMonth(lab,sourceId).reduce((worst,m)=>m.shortfall>worst.shortfall?m:worst);}
export function sourcesCoveringAllYear(lab:WaterLab) {return lab.sources.filter(s=>shortfallByMonth(lab,s.id).every(m=>m.shortfall===0)).map(s=>s.id);}
export function questionOptions(lab:WaterLab,answer:string) {return lab.sources.some(s=>s.id===answer)?lab.sources.map(s=>({id:s.id,label:s.label})):[...new Set(lab.months.map(m=>m.season))].map(id=>({id,label:id}));}
const stateSchema=z.object({sourceId:z.string(),month:z.number().int().nonnegative(),explored:z.array(z.string()),answers:z.record(z.string(),z.string())});
export type WaterState=z.infer<typeof stateSchema>;
export function waterState(lab:WaterLab,value:unknown):WaterState {
  const p=stateSchema.safeParse(value);if(!p.success)return {sourceId:lab.sources[0].id,month:0,explored:[],answers:{}};
  return {sourceId:lab.sources.some(s=>s.id===p.data.sourceId)?p.data.sourceId:lab.sources[0].id,month:Math.min(p.data.month,lab.months.length-1),explored:[...new Set(p.data.explored.filter(id=>lab.sources.some(s=>s.id===id)))],answers:Object.fromEntries(Object.entries(p.data.answers).filter(([id,answer])=>{const q=lab.questions.find(q=>q.id===id);return q&&questionOptions(lab,q.answer).some(o=>o.id===answer);} ))};
}
export function waterCompletion(lab:WaterLab,state:WaterState) {
  const valid=waterState(lab,state),sources=Math.min(valid.explored.length,lab.completion.sourcesExplored),questions=Math.min(lab.questions.filter(q=>valid.answers[q.id]===q.answer).length,lab.completion.questionsAnswered),done=sources+questions,total=lab.completion.sourcesExplored+lab.completion.questionsAnswered;
  return {done,total,score:Math.round(done/total*100),completed:done===total,sources,questions};
}
