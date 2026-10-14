import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const sdk = vi.hoisted(() => ({ parse: vi.fn(), construct: vi.fn() }));
vi.mock("openai", () => ({
  default: class {
    responses = { parse: sdk.parse };
    constructor(options: unknown) { sdk.construct(options); }
  },
}));
import { liveGuide } from "./openai";

const output = { answer: "Example answer", supported: true, citedChunkIds: ["wa-03"], nextStepId: "dry-season-check" };
beforeEach(() => {
  vi.stubEnv("OPENAI_MODEL", "test-model");
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Tests must not call the network"); }));
  sdk.parse.mockReset();
  sdk.construct.mockClear();
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("Responses API adapter with a fake SDK (GUIDE_MODE remains mock)", () => {
  it("uses responses.parse, the configured model and zodTextFormat", async () => {
    expect(process.env.GUIDE_MODE).toBe("mock");
    sdk.parse.mockResolvedValue({ output_parsed: output });
    expect(await liveGuide({ topicId: "water", question: "Why does the dry season matter?" })).toEqual(output);
    const parameters = sdk.parse.mock.calls[0][0];
    expect(parameters).toMatchObject({ model: "test-model", store: false,
      text: { format: { type: "json_schema", name: "guide_answer", strict: true } } });
    expect(parameters.text.format.schema.required).toEqual(["answer", "supported", "citedChunkIds", "nextStepId"]);
    expect(parameters.instructions).toContain("[wa-03]");
    expect(JSON.parse(parameters.input).question).toBe("Why does the dry season matter?");
    expect(sdk.construct).toHaveBeenCalledWith({ timeout: 20_000, maxRetries: 0 });
    expect(fetch).not.toHaveBeenCalled();
  });
  it.each([null, { answer: "Missing fields" }])("rejects invalid output_parsed: %j", async (value) => {
    sdk.parse.mockResolvedValue({ output_parsed: value });
    await expect(liveGuide({ topicId: "water", question: "Water?" })).rejects.toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("propagates SDK errors for the caller's mock fallback", async () => {
    sdk.parse.mockRejectedValue(new Error("Fake provider failure"));
    await expect(liveGuide({ topicId: "water", question: "Water?" })).rejects.toThrow("Fake provider failure");
  });
  it("rejects an unset model before constructing the SDK", async () => {
    vi.stubEnv("OPENAI_MODEL", "");
    await expect(liveGuide({ topicId: "water", question: "Water?" })).rejects.toThrow("OPENAI_MODEL is required");
    expect(sdk.construct).not.toHaveBeenCalled();
    expect(sdk.parse).not.toHaveBeenCalled();
  });
});
