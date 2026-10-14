import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getActivity, getChunk, getChunks, getLesson, getPathway, getSources } from "./index";

describe("content loaders", () => {
  it("loads all ten chunks, with sources and non-empty bodies", () => {
    const lesson = getLesson();
    expect(lesson.chunks.map((chunk) => chunk.id)).toEqual(
      Array.from({ length: 10 }, (_, index) => `wa-${String(index + 1).padStart(2, "0")}`),
    );
    for (const chunk of lesson.chunks) {
      expect(chunk.sourceIds.length).toBeGreaterThan(0);
      expect(chunk.body.length).toBeGreaterThan(0);
    }
  });
  it("loads sources, activity and every pathway section", () => {
    expect(getSources().sources).toHaveLength(6);
    expect(getActivity().paths.map((path) => path.id)).toEqual(["observe", "questions", "fictional"]);
    expect(getActivity().rubric).toHaveLength(6);
    expect(getActivity().feedbackRules.length).toBeGreaterThan(0);
    const pathway = getPathway();
    expect(pathway.intentions).toHaveLength(3);
    expect(pathway.stages).toHaveLength(5);
    expect(pathway.understandingCheck).toHaveLength(3);
    expect(Object.keys(pathway.stuckHints)).toHaveLength(5);
    expect(pathway.nextSteps).toHaveLength(5);
    expect(pathway.unsupportedFallback.nextStep).toBe("talk-extension");
    expect(pathway.reminder.demoOnly).toBe(true);
  });
  it("caches validated objects in module scope", () => {
    for (const loader of [getSources, getLesson, getActivity, getPathway]) {
      expect(loader()).toBe(loader());
    }
  });
  it("looks up chunks in requested order, including repeated ids", () => {
    expect(getChunk("wa-01")).toBe(getLesson().chunks[0]);
    expect(getChunks(["wa-10", "wa-01", "wa-10"]).map((chunk) => chunk.id))
      .toEqual(["wa-10", "wa-01", "wa-10"]);
    expect(getChunks([])).toEqual([]);
  });
  it("throws clearly for unknown chunks", () => {
    expect(() => getChunk("unknown")).toThrow("Unknown lesson chunk: unknown");
    expect(() => getChunks(["wa-01", "unknown"])).toThrow("Unknown lesson chunk: unknown");
  });
});
