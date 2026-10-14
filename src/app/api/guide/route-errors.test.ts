vi.mock("server-only", () => ({}));
import { afterEach, expect, it, vi } from "vitest";
vi.mock("@/lib/guide", () => ({ answerQuestion: vi.fn() }));
import { answerQuestion } from "@/lib/guide";
import { POST } from "./route";

afterEach(() => vi.clearAllMocks());

it("returns a JSON 500 without exposing internal error details", async () => {
  vi.mocked(answerQuestion).mockRejectedValue(new Error("Internal fixture details"));
  const response = await POST(new Request("http://localhost/api/guide", {
    method: "POST", body: JSON.stringify({ topicId: "water", question: "Why does the dry season matter?" }),
  }));
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ error: "The guide is temporarily unavailable" });
});
