import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/feedback/openai", () => ({ liveFeedback: vi.fn() }));
import { POST } from "./route";
import { getTopic } from "@/lib/content";
const getActivity = () => getTopic("fish-farming", "water").activity;
const getPathway = () => getTopic("fish-farming", "water").config;
import { feedbackResponseSchema } from "@/lib/feedback/types";
function request(body: unknown) {
  return new Request("http://localhost/api/feedback", { method: "POST", body: JSON.stringify(body) });
}
beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network in tests"); })));
afterEach(() => vi.unstubAllGlobals());
describe("POST /api/feedback", () => {
  it.each(["observe", "questions", "fictional"] as const)("completes the %s path via a Request", async (pathId) => {
    const path = getActivity().paths.find((path) => path.id === pathId)!;
    const response = await POST(request({ topicId: "water", pathId, response: path.example ?? "Amina's well ran low during the dry season. Neither source was tested." }));
    expect(response.status).toBe(200);
    expect(feedbackResponseSchema.parse(await response.json()).completed).toBe(true);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("returns completed false and the authored hint for idk", async () => {
    const response = await POST(request({ topicId: "water", pathId: "fictional", response: "idk" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ completed: false, strengths: [], toConsider: [],
      hint: getPathway().stuckHints["activity-fictional"] });
  });
  it.each([{}, null, { topicId: "water", pathId: "other", response: "example" },
    { topicId: "water", pathId: "observe", response: "" }, { topicId: "water", pathId: "observe", response: "   " },
    { topicId: "water", pathId: "observe", response: 1 }, { topicId: "water", pathId: "observe", response: "x".repeat(2001) },
    { topicId: "water", pathId: "observe", response: "example", intention: 1 }])("returns 400 for invalid body %j", async (body) => {
    const response = await POST(request(body));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid feedback request" });
  });
  it("returns 400 for malformed JSON", async () => {
    const response = await POST(new Request("http://localhost/api/feedback", { method: "POST", body: "{" }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Request body must be valid JSON" });
  });
});
