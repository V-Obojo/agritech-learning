vi.mock("server-only", () => ({}));
import { expect, it, vi } from "vitest";
vi.mock("@/lib/feedback", () => ({ giveFeedback: vi.fn() }));
import { giveFeedback } from "@/lib/feedback";
import { POST } from "./route";

it("returns a JSON 500 without exposing feedback error details", async () => {
  vi.mocked(giveFeedback).mockRejectedValue(new Error("Internal fixture details"));
  const response = await POST(new Request("http://localhost/api/feedback", {
    method: "POST", body: JSON.stringify({ topicId: "water", pathId: "observe", response: "A well near my house needs testing." }),
  }));
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Feedback is temporarily unavailable" });
});
