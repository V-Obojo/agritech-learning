import { z } from "zod";
import { guideResponseSchema } from "../guide/types";

const text = z.string().trim().min(1);
export const feedbackRequestSchema = z.object({
  topicId: text,
  subjectId: text.optional(),
  pathId: text,
  response: text.max(2000),
  intention: z.string().optional(),
});
export const feedbackEntrySchema = z.object({
  criterionId: text, message: text, chunkIds: z.array(text),
});
export const modelFeedbackOutputSchema = z.strictObject({
  completed: z.boolean(),
  strengths: z.array(feedbackEntrySchema),
  toConsider: z.array(feedbackEntrySchema),
  nextStepId: text,
});
export const feedbackResponseSchema = z.object({
  completed: z.boolean(),
  strengths: z.array(feedbackEntrySchema).max(1),
  toConsider: z.array(feedbackEntrySchema).max(2),
  nextStep: z.object({ id: text, label: text }),
  hint: text.optional(),
  mode: z.enum(["mock", "live", "mock-fallback"]),
}).superRefine((value, ctx) => {
  if (value.completed) {
    if (value.strengths.length !== 1 || value.toConsider.length < 1 || value.hint !== undefined) {
      ctx.addIssue({ code: "custom", message: "Completed feedback needs one strength, one or two considerations and no hint" });
    }
  } else if (!value.hint || value.strengths.length || value.toConsider.length) {
    ctx.addIssue({ code: "custom", message: "Incomplete feedback needs an authored hint and empty arrays" });
  }
});
export const helpRequestSchema = z.object({
  topicId: text,
  subjectId: text.optional(),
  step: text,
  question: text.max(500).optional(),
});
export const helpResponseSchema = z.object({
  hint: text, explanation: guideResponseSchema.optional(),
});
export type FeedbackRequest = z.infer<typeof feedbackRequestSchema>;
export type FeedbackEntry = z.infer<typeof feedbackEntrySchema>;
export type ModelFeedbackOutput = z.infer<typeof modelFeedbackOutputSchema>;
export type FeedbackResponse = z.infer<typeof feedbackResponseSchema>;
