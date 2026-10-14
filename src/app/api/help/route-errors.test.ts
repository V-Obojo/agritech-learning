import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/guide", () => ({ answerQuestion: vi.fn() }));
import { answerQuestion } from "@/lib/guide";
import { POST } from "./route";

it("returns a JSON 500 without exposing help error details", async () => {
  vi.mocked(answerQuestion).mockRejectedValue(new Error("Internal fixture details"));
  const response = await POST(new Request("http://localhost/api/help", {
    method: "POST", body: JSON.stringify({ step: "guide", question: "Why dry season?" }),
  }));
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "Help is temporarily unavailable" });
});
