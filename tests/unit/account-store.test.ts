import { beforeEach,afterEach,it,expect,vi } from "vitest";
let data:Map<string,string>;
beforeEach(()=>{vi.resetModules();vi.useFakeTimers();data=new Map();vi.stubGlobal("window",{localStorage:{getItem:(key:string)=>data.get(key) ?? null,setItem:(key:string,value:string)=>data.set(key,value),removeItem:(key:string)=>data.delete(key)},addEventListener(){},removeEventListener(){}});});
afterEach(()=>{vi.useRealTimers();vi.unstubAllGlobals();});
it("starts with server progress and debounce-saves account work without leaking it into guest storage",async()=>{
  const store=await import("../../src/lib/progress"),seed={...store.defaultProgress(),intention:"student"};
  data.set(store.progressKey,JSON.stringify(store.defaultProgress()));const guestRaw=data.get(store.progressKey);
  const fetcher=vi.fn(async()=>Response.json({saved:true}));vi.stubGlobal("fetch",fetcher);
  store.configureProgressAccount("account",seed);expect(store.loadProgress().intention).toBe("student");store.updateTopicProgress("s/t",{completed:true});
  await vi.advanceTimersByTimeAsync(999);expect(fetcher).not.toHaveBeenCalled();await vi.advanceTimersByTimeAsync(1);expect(fetcher).toHaveBeenCalledTimes(1);
  const call=fetcher.mock.calls[0] as unknown as [string,RequestInit];expect(call[0]).toBe("/api/me/progress");expect(JSON.parse(String(call[1].body)).progress.topics["s/t"].completed).toBe(true);
  expect(data.get(store.progressKey)).toBe(guestRaw);store.configureProgressAccount(null);expect(store.loadProgress().intention).toBeNull();
});
it("keeps unsaved account work after a failed save, exposes retry, and recovers",async()=>{
  const store=await import("../../src/lib/progress");store.configureProgressAccount("account");store.updateTopicProgress("s/t",{viewed:true});
  vi.stubGlobal("fetch",vi.fn(async()=>new Response(null,{status:503})));await expect(store.flushAccountProgress()).rejects.toThrow("Progress could not sync");
  expect(store.loadProgress().topics["s/t"].viewed).toBe(true);expect(store.getProgressSyncError()).not.toBeNull();
  vi.stubGlobal("fetch",vi.fn(async()=>Response.json({saved:true})));await store.flushAccountProgress();expect(store.getProgressSyncError()).toBeNull();
});
it("refreshes server data without blanking or overwriting edits made during hydration",async()=>{
  const store=await import("../../src/lib/progress");const seed={...store.defaultProgress(),intention:"student"};store.configureProgressAccount("account",seed);
  let resolve!:(response:Response)=>void;vi.stubGlobal("fetch",vi.fn(()=>new Promise<Response>(done=>{resolve=done;})));
  const refresh=store.hydrateAccountProgress();expect(store.loadProgress().intention).toBe("student");store.updateTopicProgress("s/t",{checkAnswers:{q:2}});resolve(Response.json(store.defaultProgress()));await refresh;
  expect(store.loadProgress().topics["s/t"].checkAnswers.q).toBe(2);
});
it("ignores a late account response after signing out",async()=>{
  const store=await import("../../src/lib/progress");store.configureProgressAccount("account");let resolve!:(response:Response)=>void;
  vi.stubGlobal("fetch",vi.fn(()=>new Promise<Response>(done=>{resolve=done;})));const refresh=store.hydrateAccountProgress();store.configureProgressAccount(null);
  resolve(Response.json({...store.defaultProgress(),intention:"private"}));await refresh;expect(store.loadProgress().intention).toBeNull();
});
it("batches signed-in events while leaving guest events separate",async()=>{
  const metrics=await import("../../src/lib/metrics");data.set(metrics.metricsKey,"[]");const fetcher=vi.fn(async()=>Response.json({saved:true}));vi.stubGlobal("fetch",fetcher);
  metrics.configureMetricsAccount("account");metrics.recordEvent("intention_chosen",{intention:"student"});expect(metrics.getEvents()).toHaveLength(1);expect(data.get(metrics.metricsKey)).toBe("[]");
  await vi.advanceTimersByTimeAsync(1000);expect(fetcher).toHaveBeenCalledTimes(1);metrics.configureMetricsAccount(null);expect(metrics.getEvents()).toEqual([]);
});
