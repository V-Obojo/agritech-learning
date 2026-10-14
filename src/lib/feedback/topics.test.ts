import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("./openai", () => ({ liveFeedback: vi.fn() }));
import { getTopic } from "../content";
import * as content from "../content";
import { giveFeedback, postValidateFeedback } from "./index";
import { analyzeCoverage, mockFeedback } from "./mock";
const topicId = "what-is-fish-farming";
beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network in tests"); })));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe("first-topic feedback", () => {
  it("completes the authored reflect example with valid rubric strength", async () => {
    const topic = getTopic("fish-farming", topicId);
    const result = await giveFeedback({ topicId, pathId: "reflect", response: topic.activity.paths[0].example! });
    expect(result.completed).toBe(true); expect(result.strengths).toHaveLength(1);
    expect(topic.activity.rubric.some(criterion => criterion.id === result.strengths[0].criterionId)).toBe(true);
    expect([...result.strengths,...result.toConsider].flatMap(entry => entry.chunkIds).every(id => id.startsWith("wf-"))).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("compares Tunde's weekdays and savings answer with uncovered model points", async () => {
    const request = { topicId, pathId: "fictional", response: "Tunde works weekdays and has some savings." };
    const uncovered = analyzeCoverage(request).uncoveredModelPoints[0];
    expect(uncovered).toBeDefined();
    const result = await giveFeedback(request); expect(result.completed).toBe(true);
    expect(result.toConsider[0].message).toContain(uncovered.point);
    expect(result.toConsider[0].chunkIds).toEqual(uncovered.chunks);
  });
  it.each(["reflect", "fictional"])("returns the authored activity-%s hint for idk", async pathId => {
    const result = await giveFeedback({ topicId, pathId, response: "idk" });
    expect(result).toMatchObject({ completed: false, strengths: [], toConsider: [], hint: getTopic("fish-farming",topicId).config.stuckHints[`activity-${pathId}`] });
  });
  it.each(["considering", "curious", undefined])("uses the topic's default step for %s", async intention => {
    const topic = getTopic("fish-farming",topicId);
    const result = await giveFeedback({ topicId, pathId: "reflect", response: topic.activity.paths[0].example!, intention });
    expect(result.nextStep.id).toBe(topic.config.defaultNextStep[intention ?? ""] ?? topic.config.defaultNextStep.default);
  });
  it("rejects foreign citations in model feedback and falls back locally", () => {
    const request = { topicId, pathId: "fictional", response: "Tunde works weekdays and has some savings." };
    const model = mockFeedback(request); model.strengths[0].chunkIds = ["wa-03"];
    const result = postValidateFeedback(model, request, "live");
    expect(result.mode).toBe("mock-fallback"); expect(result.strengths[0].chunkIds.every(id => id.startsWith("wf-"))).toBe(true);
  });
  it("compares model points on an arbitrary activity path", () => {
    const topic = structuredClone(getTopic("fish-farming",topicId));
    topic.activity.paths[0].modelPoints = topic.activity.paths[1].modelPoints;
    vi.spyOn(content, "resolveTopic").mockReturnValue(topic);
    const request = { topicId, pathId: "reflect", response: "I work weekdays and have some savings." };
    const uncovered = analyzeCoverage(request).uncoveredModelPoints[0];
    expect(mockFeedback(request).toConsider[0].message).toContain(uncovered.point);
  });
});
