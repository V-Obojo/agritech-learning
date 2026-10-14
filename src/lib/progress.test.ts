import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
let data: Map<string, string>;
beforeEach(() => {
  vi.resetModules(); data = new Map();
  vi.stubGlobal("window", { localStorage: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
  } });
});
afterEach(() => vi.unstubAllGlobals());
describe("progress", () => {
  it("round-trips saved progress through storage and a module reload", async () => {
    const store = await import("./progress");
    const saved = store.saveProgress({ ...store.defaultProgress(), intention: "student", lessonViewed: true,
      checkAnswers: { "uc-1": 1 }, guideQuestionsAsked: 2,
      activity: { pathId: "fictional", response: "Amina's well", feedback: null },
      reminderOptIn: true, wouldReturn: "maybe" });
    expect(data.has("agri-progress-v1")).toBe(true);
    vi.resetModules();
    expect((await import("./progress")).loadProgress()).toEqual(saved);
  });
  it.each(["{bad", "null", '{"intention":"unknown"}'])("returns defaults for corrupted or invalid JSON: %s", async (raw) => {
    const store = await import("./progress");
    data.set(store.progressKey, raw);
    expect(store.loadProgress()).toEqual(store.defaultProgress());
  });
  it("keeps working in memory when localStorage methods throw", async () => {
    vi.stubGlobal("window", { localStorage: { getItem() { throw Error("blocked"); },
      setItem() { throw Error("blocked"); }, removeItem() { throw Error("blocked"); } } });
    const store = await import("./progress");
    expect(store.loadProgress()).toEqual(store.defaultProgress());
    const saved = store.updateProgress({ intention: "curious", wouldReturn: "yes" });
    expect(store.loadProgress()).toEqual(saved);
    store.resetProgress();
    expect(store.loadProgress()).toEqual(store.defaultProgress());
  });
  it("handles a throwing localStorage getter", async () => {
    vi.stubGlobal("window", Object.defineProperty({}, "localStorage", { get() { throw Error("blocked"); } }));
    const store = await import("./progress");
    store.updateProgress({ intention: "considering" });
    expect(store.loadProgress().intention).toBe("considering");
  });
  it("preserves memory when writes fail but reads would return stale data", async () => {
    vi.stubGlobal("window", { localStorage: { getItem: () => null, setItem() { throw Error("quota"); } } });
    const store = await import("./progress");
    store.updateProgress({ intention: "student" });
    expect(store.loadProgress().intention).toBe("student");
  });
  it("resets storage and chooses the correct resume destination", async () => {
    const store = await import("./progress");
    expect(store.resumePath(store.defaultProgress())).toBe("/lesson");
    const draft = store.updateProgress({ activity: { pathId: "observe", response: "well", feedback: null } });
    expect(store.resumePath(draft)).toBe("/activity");
    store.resetProgress();
    expect(data.has(store.progressKey)).toBe(false);
    expect(store.loadProgress()).toEqual(store.defaultProgress());
  });
  it("returns stable snapshots and works without window on the server", async () => {
    const store = await import("./progress");
    expect(store.loadProgress()).toBe(store.loadProgress());
    vi.stubGlobal("window", undefined);
    expect(store.loadProgress()).toBe(store.serverProgress);
  });
});
