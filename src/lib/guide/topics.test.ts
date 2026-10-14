import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("./openai", () => ({ liveGuide: vi.fn() }));
import { getTopic } from "../content";
import { answerQuestion, postValidateGuideOutput } from "./index";
import { buildGuidePrompt } from "./prompt";
beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network in tests"); })));
afterEach(() => vi.unstubAllGlobals());
describe("guide topic isolation", () => {
  it.each([
    ["what-is-fish-farming", "What do I need to start fish farming?", "wf-05", "wf-"],
    ["water", "Why does the dry season matter for a fish pond?", "wa-03", "wa-"],
    ["water", "Why does harmattan matter for a fish pond?", "wa-03", "wa-"],
  ])("answers the authored question for %s: %s", async (topicId, question, citation, prefix) => {
    const result = await answerQuestion({ topicId, question });
    expect(result.supported).toBe(true); expect(result.citations.map(item => item.chunkId)).toContain(citation);
    expect(result.citations.every(item => item.chunkId.startsWith(prefix))).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each(["what-is-fish-farming", "water"])("uses %s fallback for unsupported questions", async topicId => {
    const config = getTopic("fish-farming", topicId).config;
    const result = await answerQuestion({ topicId, question: "What dose of medicine should I give sick catfish?" });
    expect(result).toMatchObject({ supported: false, citations: [], answer: config.unsupportedFallback.message, nextStep: { id: config.unsupportedFallback.nextStep } });
  });
  it.each([["water", "wf-05"], ["what-is-fish-farming", "wa-03"]])("rejects citations from another topic for %s", (topicId, foreign) => {
    const result = postValidateGuideOutput({ answer: "Untrusted", supported: true, citedChunkIds: [foreign], nextStepId: "unknown" }, "live", { topicId });
    expect(result.supported).toBe(false); expect(result.citations).toEqual([]);
  });
  it("grounds the first-topic prompt only in its own content", () => {
    const prompt = buildGuidePrompt({ topicId: "what-is-fish-farming", question: "What do I need?" });
    expect(prompt.instructions).toContain("wf-05"); expect(prompt.instructions).not.toContain("wa-03");
  });
});
