import { giveFeedback } from "@/lib/feedback";
import { feedbackRequestSchema } from "@/lib/feedback/types";

// POST is request-time and uncached with Cache Components.
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Request body must be valid JSON" }, { status: 400 }); }
  const parsed = feedbackRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Invalid feedback request" }, { status: 400 });
  try { return Response.json(await giveFeedback(parsed.data)); }
  catch { return Response.json({ error: "Feedback is temporarily unavailable" }, { status: 500 }); }
}
