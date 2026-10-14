import {z} from "zod";
import type {ModelLab} from "@/lib/content/media-labs";
export const explorationSchema=z.object({hotspots:z.array(z.string()),modes:z.array(z.string())});
export type Exploration=z.infer<typeof explorationSchema>;
export function readExploration(data:unknown):Exploration {const parsed=explorationSchema.safeParse(data);return parsed.success?parsed.data:{hotspots:[],modes:[]};}
export function explore(lab:ModelLab,current:Exploration,action:{kind:"hotspots"|"modes";id:string}):Exploration {
  const available=action.kind==="hotspots"?lab.hotspots:lab.modes;
  if(!available.some(item=>item.id===action.id)) return current;
  return {...current,[action.kind]:[...new Set([...current[action.kind],action.id])]};
}
export function explorationStatus(lab:ModelLab,state:Exploration) {
  const hotspots=new Set(state.hotspots.filter(id=>lab.hotspots.some(h=>h.id===id))).size,modes=new Set(state.modes.filter(id=>lab.modes.some(m=>m.id===id))).size;
  const done=Math.min(hotspots,lab.completion.hotspotsVisited)+Math.min(modes,lab.completion.modesViewed),total=lab.completion.hotspotsVisited+lab.completion.modesViewed;
  return {hotspots,modes,done,total,completed:done>=total,score:Math.round(done/total*100)};
}
