import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
vi.mock("server-only", () => ({}));
vi.mock("node:fs", async importOriginal => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return { ...actual, readFileSync: vi.fn(actual.readFileSync) };
});
describe("loader errors", () => {
  beforeEach(() => { vi.resetModules(); vi.mocked(readFileSync).mockReset(); });
  it("identifies malformed JSON", async () => {
    vi.mocked(readFileSync).mockReturnValue("{invalid");
    const { getSources } = await import("./index");
    expect(() => getSources()).toThrow("Cannot load content/sources.json");
  });
  it.each([["getSources", "sources.json"], ["getCatalog", "catalog.json"]] as const)("validates %s with zod", async (loader, filename) => {
    vi.mocked(readFileSync).mockReturnValue("{}"); const loaders = await import("./index");
    expect(() => loaders[loader]()).toThrow(`Invalid content/${filename}`);
  });
  it.each(["lesson.md", "topic.json", "activity.json", "path.json"])("rejects malformed %s without caching it", async filename => {
    const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
    vi.mocked(readFileSync).mockImplementation((file, options) => String(file).endsWith(filename) ? "invalid" : actual.readFileSync(file, options));
    const { getTopic } = await import("./index"); expect(() => getTopic("fish-farming", "water")).toThrow();
    vi.mocked(readFileSync).mockImplementation(actual.readFileSync);
    expect(getTopic("fish-farming", "water").lesson.chunks).toHaveLength(10);
  });
  it("preserves read errors", async () => {
    vi.mocked(readFileSync).mockImplementation(() => { throw new Error("fixture read failure"); });
    const { getSources } = await import("./index"); expect(() => getSources()).toThrow("Cannot read content/sources.json");
  });
  it.each(["lesson.md", "topic.json", "activity.json"])("reports a missing live-topic %s in integrity", async filename => {
    const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
    vi.mocked(readFileSync).mockImplementation((file, options) => {
      if (String(file).includes("water") && String(file).endsWith(filename)) throw new Error("fixture missing file");
      return actual.readFileSync(file, options);
    });
    const { checkContentIntegrity } = await import("./integrity");
    expect(checkContentIntegrity().some(problem => problem.includes(filename))).toBe(true);
  });
});
