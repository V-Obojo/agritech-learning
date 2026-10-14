import {it,expect,describe,vi} from "vitest";
vi.mock("server-only",()=>({}));
import {getLab} from "@/lib/content";
import {modelLabSchema} from "@/lib/content/media-labs";
import {explore,readExploration,explorationStatus} from "./progress";
import {partPosition,partPositions} from "./model-parts";
import {buildCatfish} from "./catfish-geometry";
import {eventSchema} from "@/lib/metrics";
const lab=modelLabSchema.parse(getLab("catfish-3d"));
describe("lab exploration and anatomy",()=>{
  it("legacy or malformed state starts empty",()=>{expect(readExploration(null)).toEqual({hotspots:[],modes:[]});expect(readExploration({hotspots:3})).toEqual({hotspots:[],modes:[]});});
  it("counts distinct valid visits only and requires both modes",()=>{
    let state=readExploration(null);state=explore(lab,state,{kind:"modes",id:lab.modes[0].id});
    for(const h of lab.hotspots.slice(0,5)) {state=explore(lab,state,{kind:"hotspots",id:h.id});state=explore(lab,state,{kind:"hotspots",id:h.id});}
    expect(explorationStatus(lab,state)).toMatchObject({hotspots:5,modes:1,completed:false,score:86});
    const unchanged=explore(lab,state,{kind:"hotspots",id:"missing"});expect(unchanged).toBe(state);
    state=explore(lab,state,{kind:"modes",id:lab.modes[1].id});expect(explorationStatus(lab,state)).toMatchObject({completed:true,score:100});expect(explorationStatus(lab,readExploration(state)).completed).toBe(true);
  });
  it("ignores fabricated persisted ids and caps progress",()=>{expect(explorationStatus(lab,{hotspots:["missing"],modes:["missing"]}).done).toBe(0);expect(explorationStatus(lab,{hotspots:lab.hotspots.map(h=>h.id),modes:lab.modes.map(m=>m.id)}).score).toBe(100);});
  it("maps every authored hotspot to a named model part and mode-aware position",()=>{for(const h of lab.hotspots){expect(partPositions[h.part]).toHaveLength(3);expect(partPosition(h.part).every(Number.isFinite)).toBe(true);expect(partPosition(h.part,true)).not.toEqual(partPosition(h.part));}expect(()=>partPosition("unknown")).toThrow("Unknown procedural part");});
  it("builds eight tapered barbels and stays below 20,000 triangles",()=>{const model=buildCatfish(lab.model.bodyColors);expect(model.barbels).toHaveLength(8);expect(model.barbels.filter(b=>b.part==="barbel-mandibular")).toHaveLength(4);expect(model.triangles).toBeLessThan(20000);expect(model.triangles).toBeGreaterThan(3000);expect(model.body.getAttribute("color").count).toBe(model.body.getAttribute("position").count);model.dispose();});
  it.each(["lab_started","lab_progress","lab_completed"] as const)("%s requires all identifiers",name=>{const event={name,at:"2026-10-14T16:00:00.000Z",details:{labId:lab.id,subjectId:lab.subjectId,topicId:lab.topicId}};expect(eventSchema.safeParse(event).success).toBe(true);for(const field of ["labId","subjectId","topicId"]){const details:Record<string,string>={...event.details};delete details[field];expect(eventSchema.safeParse({...event,details}).success).toBe(false);}});
});
