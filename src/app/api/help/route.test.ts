import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/guide/openai", () => ({ liveGuide: vi.fn() }));
import { POST } from "./route";
import { getPathway } from "@/lib/content";
import { helpResponseSchema } from "@/lib/feedback/types";
function request(body: unknown) {
  return new Request("http://localhost/api/help", { method: "POST", body: JSON.stringify(body) });
}
beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network in tests"); })));
afterEach(() => vi.unstubAllGlobals());
describe("POST /api/help", () => {
  it.each(["lesson", "activity-observe", "activity-questions", "activity-fictional", "guide"] as const)(
    "returns the authored %s hint without an explanation", async (step) => {
      const response = await POST(request({ step }));
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ hint: getPathway().stuckHints[step] });
      expect(fetch).not.toHaveBeenCalled();
    },
  );
  it.each(["Why does the dry season matter for a fish pond?", "What dose of medicine should I give sick catfish?"])(
    "returns the fictional hint and a cited or unsupported guide explanation for %s", async (question) => {
      const response = await POST(request({ step: "activity-fictional", question }));
      expect(response.status).toBe(200);
      const result = helpResponseSchema.parse(await response.json());
      expect(result.hint).toBe(getPathway().stuckHints["activity-fictional"]);
      expect(result.explanation).toBeDefined();
      if (result.explanation!.supported) expect(result.explanation!.citations.length).toBeGreaterThan(0);
      else expect(result.explanation!.nextStep.id).toBe("talk-extension");
      expect(fetch).not.toHaveBeenCalled();
    },
  );
  it.each([{}, null, { step: "unknown" }, { step: "guide", question: "" },
    { step: "guide", question: "   " }, { step: "guide", question: 1 },
    { step: "guide", question: "x".repeat(501) }])("returns 400 for invalid body %j", async (body) => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid help request" });
  });
  it("returns 400 for malformed JSON", async () => {
    const response = await POST(new Request("http://localhost/api/help", { method: "POST", body: "{" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Request body must be valid JSON" });
  });
});
