import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";

vi.mock("server-only", () => ({}));
vi.mock("node:fs", () => ({ readFileSync: vi.fn() }));

describe("loader errors", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.mocked(readFileSync).mockReset();
  });
  it("identifies a file containing malformed JSON", async () => {
    vi.mocked(readFileSync).mockReturnValue("{invalid");
    const { getSources } = await import("./index");
    expect(() => getSources()).toThrow("Cannot load content/sources.json");
  });
  it.each([
    ["getSources", "sources.json"],
    ["getActivity", "activity.json"],
    ["getPathway", "pathway.json"],
  ] as const)("validates %s with zod", async (loader, filename) => {
    vi.mocked(readFileSync).mockReturnValue("{}");
    const loaders = await import("./index");
    expect(() => loaders[loader]()).toThrow(`Invalid content/${filename}`);
  });
  it("identifies the lesson file when parsing fails", async () => {
    vi.mocked(readFileSync).mockReturnValue("invalid lesson");
    const { getLesson } = await import("./index");
    expect(() => getLesson()).toThrow("Cannot load content/lessons/water-availability.md: Error: Invalid lesson");
  });
  it("preserves a read error as the cause", async () => {
    const readError = new Error("fixture read failure");
    vi.mocked(readFileSync).mockImplementation(() => { throw readError; });
    const { getActivity } = await import("./index");
    expect(() => getActivity()).toThrow("Cannot read content/activity.json");
  });
});
