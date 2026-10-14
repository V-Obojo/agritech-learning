import { z } from "zod";

const text = z.string().trim().min(1);
export const guideRequestSchema = z.object({
  topicId: text,
  subjectId: text.optional(),
  question: text.max(500),
  intention: z.enum(["curious", "considering", "student"]).optional(),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]), content: z.string(),
  })).max(6).optional(),
});

export const modelGuideOutputSchema = z.strictObject({
  answer: text,
  supported: z.boolean(),
  citedChunkIds: z.array(text),
  nextStepId: text,
});

export const guideResponseSchema = z.object({
  answer: text,
  supported: z.boolean(),
  citations: z.array(z.object({
    chunkId: text, title: text,
    sources: z.array(z.object({ id: text, title: text, url: z.url() })).min(1),
  })),
  nextStep: z.object({ id: text, label: text }),
  mode: z.enum(["mock", "live", "mock-fallback"]),
});

export type GuideRequest = z.infer<typeof guideRequestSchema>;
export type ModelGuideOutput = z.infer<typeof modelGuideOutputSchema>;
export type GuideResponse = z.infer<typeof guideResponseSchema>;
export type GuideMode = GuideResponse["mode"];
