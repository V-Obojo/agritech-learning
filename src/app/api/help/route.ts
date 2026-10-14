import { resolveTopic, InvalidTopicError } from "@/lib/content";
import { answerQuestion } from "@/lib/guide";
import { helpRequestSchema, helpResponseSchema } from "@/lib/feedback/types";

// The hint is always authored; only the optional explanation uses the guide.
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Request body must be valid JSON" }, { status: 400 }); }
  const parsed = helpRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid help request" }, { status: 400 });
  try {
    const { step, question } = parsed.data;
    const topic = resolveTopic(parsed.data);
    if (!Object.hasOwn(topic.config.stuckHints, step)) return Response.json({ error: "Invalid help request" }, { status: 400 });
    const result = helpResponseSchema.parse({
      hint: topic.config.stuckHints[step],
      ...(question !== undefined ? { explanation: await answerQuestion({ ...parsed.data, question }) } : {}),
    });
    return Response.json(result);
  } catch (error) {
    if (error instanceof InvalidTopicError) return Response.json({ error: error.message }, { status: 400 });
    return Response.json({ error: "Help is temporarily unavailable" }, { status: 500 });
  }
}
