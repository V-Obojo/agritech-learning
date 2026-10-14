import { resolveTopic, InvalidTopicError } from "@/lib/content";
import { answerQuestion } from "@/lib/guide";
import { guideRequestSchema } from "@/lib/guide/types";

// POST is always request-time and uncached, including with Cache Components.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }
  const parsed = guideRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid guide request" }, { status: 400 });
  }
  try {
    resolveTopic(parsed.data);
    return Response.json(await answerQuestion(parsed.data));
  } catch (error) {
    if (error instanceof InvalidTopicError) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ error: "The guide is temporarily unavailable" }, { status: 500 });
  }
}
