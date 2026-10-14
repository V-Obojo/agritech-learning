import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("./openai", () => ({ liveFeedback: vi.fn() }));
import { getTopic } from "../content";
const getActivity = () => getTopic("fish-farming", "water").activity;
const getLesson = () => getTopic("fish-farming", "water").lesson;
const getPathway = () => getTopic("fish-farming", "water").config;
import { giveFeedback, postValidateFeedback } from "./index";
import { analyzeCoverage, isTooShort, mockFeedback } from "./mock";
import { liveFeedback } from "./openai";
import { feedbackResponseSchema, type FeedbackRequest } from "./types";

const fictional = "Amina's well gets low in the dry season. She needs to find out about testing the water.";
const examples: FeedbackRequest[] = [
  { topicId: "water", pathId: "observe", response: getActivity().paths[0].example! },
  { topicId: "water", pathId: "questions", response: getActivity().paths[1].example! },
  { topicId: "water", pathId: "fictional", response: fictional },
];
beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network in tests"); })));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("activity feedback", () => {
  it.each(examples)("completes $pathId using authored examples or Amina's no-farm-access answer", async (request) => {
    const result = await giveFeedback(request);
    expect(result.completed).toBe(true);
    expect(result.strengths).toHaveLength(1);
    expect(result.toConsider.length).toBeGreaterThanOrEqual(1);
    expect(result.toConsider.length).toBeLessThanOrEqual(2);
    for (const consideration of result.toConsider) expect(consideration.message).toMatch(/\?$/);
    for (const entry of [...result.strengths, ...result.toConsider]) {
      expect(getActivity().rubric.some((criterion) => criterion.id === entry.criterionId)).toBe(true);
      expect(entry.chunkIds.length).toBeGreaterThan(0);
      for (const id of entry.chunkIds) expect(getLesson().chunks.some((chunk) => chunk.id === id)).toBe(true);
    }
    expect(feedbackResponseSchema.safeParse(result).success).toBe(true);
    expect(result.mode).toBe("mock");
    expect(liveFeedback).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("recognises open-questions coverage in the questions example", () => {
    expect(analyzeCoverage(examples[1]).coveredCriteria.map((criterion) => criterion.id)).toContain("open-questions");
  });
  it("suggests Amina's uncovered gravity/stream model point with wa-04", async () => {
    const coverage = analyzeCoverage(examples[2]);
    expect(coverage.coveredModelPointCount).toBeGreaterThan(0);
    const result = await giveFeedback(examples[2]);
    expect(result.toConsider[0]).toMatchObject({ criterionId: "access-flow", chunkIds: ["wa-04"] });
    expect(result.toConsider[0].message).toContain(getActivity().paths[2].modelPoints![1].point);
  });
  it.each(["observe", "questions", "fictional"] as const)("returns the authored %s hint for idk", async (pathId) => {
    const result = await giveFeedback({ topicId: "water", pathId, response: "idk" });
    expect(result).toMatchObject({ completed: false, strengths: [], toConsider: [],
      hint: getPathway().stuckHints[`activity-${pathId}`], mode: "mock" });
  });
  it("counts meaningful characters without punctuation or padding", () => {
    expect(isTooShort("idk" + "! ".repeat(50))).toBe(true);
    expect(isTooShort("x".repeat(19))).toBe(true);
    expect(isTooShort("x".repeat(20))).toBe(false);
  });
  it.each(["considering", "curious", "student", undefined])("selects a real next step for %s", async (intention) => {
    const result = await giveFeedback({ ...examples[0], intention });
    expect(result.nextStep.id).toBe(intention === "considering" ? "dry-season-check" : "talk-farmer");
  });
  it("drops invalid criteria and chunks, keeps valid entries, and defaults an unknown step", () => {
    const value = mockFeedback(examples[0]);
    value.strengths.unshift({ criterionId: "invalid", message: "Invalid", chunkIds: ["wa-03"] });
    value.strengths[1].chunkIds.push("wa-99");
    value.nextStepId = "invalid";
    const result = postValidateFeedback(value, { ...examples[0], intention: "considering" }, "live");
    expect(result.mode).toBe("live");
    expect(result.strengths[0].criterionId).toBe("source-identified");
    expect(result.strengths[0].chunkIds).not.toContain("wa-99");
    expect(result.nextStep.id).toBe("dry-season-check");
  });
  it.each(["criterion", "chunks", "considerations"])("falls back to mock for invalid %s", (invalid) => {
    const value = mockFeedback(examples[0]);
    if (invalid === "criterion") value.strengths[0].criterionId = "invalid";
    if (invalid === "chunks") value.strengths[0].chunkIds = ["wa-99"];
    if (invalid === "considerations") value.toConsider = [];
    expect(postValidateFeedback(value, examples[0], "live")).toEqual({
      ...postValidateFeedback(mockFeedback(examples[0]), examples[0], "mock"), mode: "mock-fallback",
    });
  });
  it("honours a valid model next step", () => {
    const value = mockFeedback(examples[0]);
    value.nextStepId = "testing";
    expect(postValidateFeedback(value, examples[0], "live").nextStep.id).toBe("testing");
  });
  it("overrides model completion for short answers with the authored hint", () => {
    const result = postValidateFeedback(mockFeedback(examples[0]), { topicId: "water", pathId: "fictional", response: "idk" }, "live");
    expect(result.completed).toBe(false);
    expect(result.strengths).toEqual([]);
    expect(result.toConsider).toEqual([]);
    expect(result.hint).toBe(getPathway().stuckHints["activity-fictional"]);
  });
  it("offers authored help when no rubric criteria are matched", async () => {
    const result = await giveFeedback({ topicId: "water", pathId: "observe", response: "abcdefghijklmnopqrstuvwxyz" });
    expect(result.completed).toBe(false);
    expect(result.hint).toBe(getPathway().stuckHints["activity-observe"]);
  });
  it("keeps reflection available when all rubric criteria are covered", () => {
    const response = "well dry season tested pump shared unknown ask extension?";
    const result = mockFeedback({ topicId: "water", pathId: "observe", response });
    expect(result.strengths).toHaveLength(1);
    expect(result.toConsider).toHaveLength(1);
  });
});
