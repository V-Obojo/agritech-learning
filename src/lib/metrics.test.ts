import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
let data:Map<string,string>;
beforeEach(()=>{
  vi.resetModules();data=new Map();
  vi.stubGlobal("window",{localStorage:{getItem:(key:string)=>data.get(key) ?? null,setItem:(key:string,value:string)=>data.set(key,value),removeItem:(key:string)=>data.delete(key)}});
});
afterEach(()=>vi.unstubAllGlobals());
describe("topic-aware local metrics",()=>{
  it.each(["topic_opened","lesson_viewed","check_answered","guide_asked","guide_unsupported","help_requested","activity_submitted","activity_completed","would_return"] as const)("requires both topic identifiers for %s",async name=>{
    const store=await import("./metrics");
    store.recordEvent(name);store.recordEvent(name,{subjectId:"subject"});store.recordEvent(name,{topicId:"topic"});
    expect(store.getEvents()).toEqual([]);
    store.recordEvent(name,{subjectId:"subject",topicId:"topic"});
    expect(store.getEvents()).toHaveLength(1);expect(store.getEvents()[0].details).toEqual({subjectId:"subject",topicId:"topic"});
  });
  it("records navigation identifiers and global intention without fabricating topic context",async()=>{
    const store=await import("./metrics");
    store.recordEvent("area_opened",{areaId:"area"});store.recordEvent("subject_opened",{areaId:"area",subjectId:"subject"});store.recordEvent("intention_chosen",{intention:"curious"});
    expect(store.getEvents().map(event=>event.name)).toEqual(["area_opened","subject_opened","intention_chosen"]);
    store.recordEvent("area_opened",{});store.recordEvent("subject_opened",{subjectId:"subject"});expect(store.getEvents()).toHaveLength(3);
  });
  it("round-trips valid events and ignores legacy records without losing valid ones",async()=>{
    const store=await import("./metrics");store.recordEvent("activity_completed",{subjectId:"subject",topicId:"topic",pathId:"reflect"});
    const valid=store.getEvents()[0];
    data.set(store.metricsKey,JSON.stringify([{...valid,details:{pathId:"reflect"}},valid]));
    vi.resetModules();expect((await import("./metrics")).getEvents()).toEqual([valid]);
  });
  it("keeps working and resets in memory when storage throws",async()=>{
    vi.stubGlobal("window",{localStorage:{getItem(){throw Error("blocked");},setItem(){throw Error("blocked");},removeItem(){throw Error("blocked");}}});
    const store=await import("./metrics");store.recordEvent("guide_asked",{subjectId:"subject",topicId:"topic"});expect(store.getEvents()).toHaveLength(1);
    store.resetMetrics();expect(store.getEvents()).toEqual([]);
  });
  it("returns no events for corrupt JSON",async()=>{
    const store=await import("./metrics");data.set(store.metricsKey,"{bad");expect(store.getEvents()).toEqual([]);
  });
});
