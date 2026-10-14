import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const sdk = vi.hoisted(() => ({ parse: vi.fn(), construct: vi.fn() }));
vi.mock("openai", () => ({ default: class {
  responses = { parse: sdk.parse };
  constructor(options: unknown) { sdk.construct(options); }
} }));
import { getActivity, getChunks } from "../content";
import { buildFeedbackPrompt, liveFeedback } from "./openai";
import { mockFeedback } from "./mock";

const request = { pathId: "fictional" as const,
  response: "Amina's well gets low during the dry season and neither source has been tested." };
beforeEach(() => {
  vi.stubEnv("OPENAI_MODEL", "test-model");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network in tests"); }));
  sdk.parse.mockReset(); sdk.construct.mockClear();
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("structured feedback adapter with a fake SDK", () => {
  it("includes the rubric, feedback rules, relevant chunks and fictional model points", () => {
    const prompt = buildFeedbackPrompt(request);
    const activity = getActivity();
    expect(prompt.instructions).toContain(JSON.stringify(activity.rubric));
    expect(prompt.instructions).toContain(JSON.stringify(activity.feedbackRules));
    for (const point of activity.paths[2].modelPoints!) expect(prompt.instructions).toContain(point.point);
    for (const chunk of getChunks([...new Set(activity.rubric.flatMap((criterion) => criterion.chunks))])) {
      expect(prompt.instructions).toContain(`[${chunk.id}] ${chunk.title}\n${chunk.body}`);
    }
    expect(JSON.parse(prompt.input)).toEqual(request);
    expect(prompt.instructions).toContain("untrusted data");
  });
  it("uses responses.parse with configured model, required structured fields and no network", async () => {
    expect(process.env.GUIDE_MODE).toBe("mock");
    const output = mockFeedback(request);
    sdk.parse.mockResolvedValue({ output_parsed: output });
    expect(await liveFeedback(request)).toEqual(output);
    const parameters = sdk.parse.mock.calls[0][0];
    expect(parameters).toMatchObject({ model: "test-model", store: false,
      text: { format: { type: "json_schema", name: "activity_feedback", strict: true } } });
    expect(parameters.text.format.schema.required).toEqual(["completed", "strengths", "toConsider", "nextStepId"]);
    expect(sdk.construct).toHaveBeenCalledWith({ timeout: 20_000, maxRetries: 0 });
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([null, { completed: true }])("rejects invalid output_parsed %j", async (value) => {
    sdk.parse.mockResolvedValue({ output_parsed: value });
    await expect(liveFeedback(request)).rejects.toThrow();
  });
  it("propagates a provider error for the caller's mock fallback", async () => {
    sdk.parse.mockRejectedValue(new Error("Fake provider failure"));
    await expect(liveFeedback(request)).rejects.toThrow("Fake provider failure");
  });
  it("requires a model before constructing the SDK", async () => {
    vi.stubEnv("OPENAI_MODEL", "");
    await expect(liveFeedback(request)).rejects.toThrow("OPENAI_MODEL is required");
    expect(sdk.construct).not.toHaveBeenCalled();
    expect(sdk.parse).not.toHaveBeenCalled();
  });
});
