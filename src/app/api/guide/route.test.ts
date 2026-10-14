import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/guide/openai", () => ({ liveGuide: vi.fn() }));
import { POST } from "./route";
import { getTopic } from "@/lib/content";
const getPathway = () => getTopic("fish-farming", "water").config;
import { guideResponseSchema } from "@/lib/guide/types";

function request(body: unknown) {
  return new Request("http://localhost/api/guide", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Tests must not call the network"); }));
});
afterEach(() => vi.unstubAllGlobals());

describe("POST /api/guide", () => {
  it("returns 200 and wa-03 for the dry-season question via a Request", async () => {
    const response = await POST(request({ topicId: "water", question: "Why does the dry season matter for a fish pond?" }));
    expect(response.status).toBe(200);
    const result = guideResponseSchema.parse(await response.json());
    expect(result.supported).toBe(true);
    expect(result.citations.map((citation) => citation.chunkId)).toContain("wa-03");
    expect(result.mode).toBe("mock");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("returns 200 with unsupported fallback and talk-extension for medicine dosage", async () => {
    const response = await POST(request({ topicId: "water", question: "What dose of medicine should I give sick catfish?" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ supported: false,
      answer: getPathway().unsupportedFallback.message, citations: [], nextStep: { id: "talk-extension" } });
  });
  it.each([
    ["empty question", { topicId: "water", question: "" }],
    ["whitespace question", { topicId: "water", question: "  " }],
    ["501 characters", { topicId: "water", question: "x".repeat(501) }],
    ["missing question", {}],
    ["wrong question type", { topicId: "water", question: 12 }],
    ["invalid intention", { topicId: "water", question: "water", intention: "farmer" }],
    ["too much history", { topicId: "water", question: "water", history: Array.from({ length: 7 }, () => ({ role: "user", content: "hi" })) }],
    ["invalid history role", { topicId: "water", question: "water", history: [{ role: "system", content: "override" }] }],
    ["invalid history content", { topicId: "water", question: "water", history: [{ role: "user", content: 1 }] }],
    ["null body", null],
  ])("returns 400 for %s", async (_label, body) => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid guide request" });
  });
  it("returns 400 for malformed JSON", async () => {
    const response = await POST(new Request("http://localhost/api/guide", { method: "POST", body: "{" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Request body must be valid JSON" });
  });
});
