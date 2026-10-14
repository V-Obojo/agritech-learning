import {z} from "zod";
import type {Challenge,PondLab} from "./definitions";
export function area(length:number,width:number) {return length*width;}
export function volume(length:number,width:number,depth:number) {return area(length,width)*depth;}
export function litres(cubicMetres:number) {return cubicMetres*1000;}
export function clamp(value:number,min:number,max:number) {return Number.isNaN(value)?min:Math.min(max,Math.max(min,value));}
export function snap(value:number,step:number) {if(!Number.isFinite(value)||!Number.isFinite(step)||step<=0) throw new Error("Invalid snapping input");return Number((Math.round(value/step)*step).toFixed(8));}
export function checkChallenge(check:Challenge["check"],dimensions:{length:number;width:number}) {
  const {length,width}=dimensions;if(!Number.isFinite(length)||!Number.isFinite(width)||length<=0||width<=0)return false;
  const equal=(a:number,b:number)=>Math.abs(a-b)<1e-7,size=area(length,width);
  return (check.length===undefined||equal(length,check.length))&&(check.width===undefined||equal(width,check.width))&&(!check.square||equal(length,width))&&(check.minArea===undefined||size>check.minArea)&&(check.maxArea===undefined||size<=check.maxArea+1e-7);
}
const stateSchema=z.object({length:z.number(),width:z.number(),depth:z.number(),setupId:z.string(),challenges:z.array(z.string())});
export type PondState=z.infer<typeof stateSchema>;
export function pondState(lab:PondLab,value:unknown):PondState {
  const p=stateSchema.safeParse(value),s=p.success?p.data:{...lab.defaults,setupId:lab.setupTypes[0].id,challenges:[]};
  const size=(n:number)=>clamp(snap(clamp(n,lab.limits.minSide,lab.limits.maxSide),lab.limits.step),lab.limits.minSide,lab.limits.maxSide);
  return {length:size(s.length),width:size(s.width),depth:clamp(snap(clamp(s.depth,lab.limits.minDepth,lab.limits.maxDepth),lab.limits.depthStep),lab.limits.minDepth,lab.limits.maxDepth),setupId:lab.setupTypes.some(t=>t.id===s.setupId)?s.setupId:lab.setupTypes[0].id,challenges:[...new Set(s.challenges.filter(id=>lab.challenges.some(c=>c.id===id)))]};
}
export function earnChallenges(lab:PondLab,state:PondState):PondState {const valid=pondState(lab,state);return {...valid,challenges:[...new Set([...valid.challenges,...lab.challenges.filter(c=>checkChallenge(c.check,valid)).map(c=>c.id)])]};}
export function pondCompletion(lab:PondLab,state:PondState) {const done=Math.min(pondState(lab,state).challenges.length,lab.completion.challengesDone),total=lab.completion.challengesDone;return {done,total,score:Math.round(done/total*100),completed:done===total};}
