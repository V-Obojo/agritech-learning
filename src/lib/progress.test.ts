import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
let data: Map<string, string>;
beforeEach(() => {
  vi.resetModules(); data = new Map();
  vi.stubGlobal("window", { localStorage: { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => data.set(key,value), removeItem: (key: string) => data.delete(key) } });
});
afterEach(() => vi.unstubAllGlobals());
describe("progress v2", () => {
  it("round-trips independent topics, reminders and intention through a module reload", async () => {
    const store = await import("./progress");
    const first = store.topicKey("fish-farming", "what-is-fish-farming"); const water = store.topicKey("fish-farming", "water");
    store.updateProgress({intention:"student",wouldReturn:"maybe",reminderOptIn:{[first]:true,[water]:false}});
    store.updateTopicProgress(first,{viewed:true,checkAnswers:{"uc-1":1},guideQuestionsAsked:2,activity:{pathId:"reflect",response:"My time and savings",feedback:null},completed:true});
    store.updateTopicProgress(water,{viewed:true,checkAnswers:{"uc-1":0},activity:{pathId:"questions",response:"Water questions",feedback:null}});
    const saved = store.visitTopic(water,"/animal-farming/fish-farming/water/activity");
    expect(data.has("agri-progress-v2")).toBe(true); expect(saved.topics[first].checkAnswers).toEqual({"uc-1":1});
    vi.resetModules(); expect((await import("./progress")).loadProgress()).toEqual(saved);
  });
  it("reports done, in-progress and not-started independently", async () => {
    const store = await import("./progress");
    expect(store.topicStatus(store.loadProgress(),"s/t")).toBe("not-started");
    store.visitTopic("s/t","/s/t",true); expect(store.topicStatus(store.loadProgress(),"s/t")).toBe("in-progress");
    store.updateTopicProgress("s/t",{completed:true}); expect(store.topicStatus(store.loadProgress(),"s/t")).toBe("done");
    expect(store.topicStatus(store.loadProgress(),"s/other")).toBe("not-started");
  });
  it("records and resumes each topic page visit while preserving other work", async () => {
    const store = await import("./progress"); store.updateTopicProgress("s/t",{guideQuestionsAsked:2});
    for(const path of ["/a/s/t","/a/s/t/activity","/a/s/t/next"]) {
      const saved=store.visitTopic("s/t",path); expect(saved.lastPath).toBe(path); expect(store.resumePath(saved)).toBe(path);
    }
    expect(store.loadProgress().topics["s/t"].guideQuestionsAsked).toBe(2);
  });
  it.each(["{bad", "null", '{"intention":"unknown"}'])("returns defaults for corrupt or invalid JSON: %s", async raw => {
    const store=await import("./progress"); data.set(store.progressKey,raw); expect(store.loadProgress()).toEqual(store.defaultProgress());
  });
  it("ignores v1 data", async () => {
    data.set("agri-progress-v1",JSON.stringify({intention:"student",lessonViewed:true}));
    const store=await import("./progress"); expect(store.loadProgress()).toEqual(store.defaultProgress());
  });
  it("keeps topic work in memory when storage methods throw", async () => {
    vi.stubGlobal("window",{localStorage:{getItem(){throw Error("blocked");},setItem(){throw Error("blocked");},removeItem(){throw Error("blocked");}}});
    const store=await import("./progress"); store.loadProgress(); store.updateTopicProgress("s/t",{viewed:true});
    const saved=store.visitTopic("s/t","/a/s/t/next"); expect(store.loadProgress()).toEqual(saved);
    store.resetProgress(); expect(store.loadProgress()).toEqual(store.defaultProgress());
  });
  it("handles a throwing localStorage getter", async () => {
    vi.stubGlobal("window",Object.defineProperty({},"localStorage",{get(){throw Error("blocked");}}));
    const store=await import("./progress"); store.updateProgress({intention:"considering"}); expect(store.loadProgress().intention).toBe("considering");
  });
  it("preserves memory after writes fail and reads would return stale data", async () => {
    vi.stubGlobal("window",{localStorage:{getItem:()=>null,setItem(){throw Error("quota");}}});
    const store=await import("./progress"); store.updateTopicProgress("s/t",{viewed:true}); expect(store.loadProgress().topics["s/t"].viewed).toBe(true);
  });
  it("rejects invalid topic payloads and external resume paths", async () => {
    const store=await import("./progress"); const saved=store.updateTopicProgress("s/t",{viewed:true});
    expect(store.updateTopicProgress("s/t",{guideQuestionsAsked:-1})).toBe(saved);
    expect(store.updateProgress({lastPath:"//external.example"})).toBe(saved);
  });
  it("resets all topic work and storage", async () => {
    const store=await import("./progress"); store.visitTopic("s/t","/a/s/t",true); store.resetProgress();
    expect(data.has(store.progressKey)).toBe(false); expect(store.loadProgress()).toEqual(store.defaultProgress()); expect(store.resumePath(store.loadProgress())).toBe("/");
  });
  it("returns stable snapshots and server defaults", async () => {
    const store=await import("./progress"); expect(store.loadProgress()).toBe(store.loadProgress());
    vi.stubGlobal("window",undefined); expect(store.loadProgress()).toBe(store.serverProgress);
  });
});
