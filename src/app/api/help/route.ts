import { getPathway } from "@/lib/content";
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
    const result = helpResponseSchema.parse({
      hint: getPathway().stuckHints[step],
      ...(question !== undefined ? { explanation: await answerQuestion({ question }) } : {}),
    });
    return Response.json(result);
  } catch { return Response.json({ error: "Help is temporarily unavailable" }, { status: 500 }); }
}
