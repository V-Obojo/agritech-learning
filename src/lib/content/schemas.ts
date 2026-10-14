import { z } from "zod";

const text = z.string().trim().min(1);
const texts = z.array(text);

export const sourceSchema = z.object({
  id: text, title: text, publisher: text,
  year: z.number().int().positive(), url: z.url(), accessed: z.iso.date(),
});
export const sourcesSchema = z.object({
  status: text, note: text, sources: z.array(sourceSchema).min(1),
});
export const lessonChunkSchema = z.object({
  id: text, title: text, sourceIds: texts.min(1), body: text,
});
export const lessonSchema = z.object({
  id: text, title: text, species: text, region: text, status: text,
  review_note: text, estimated_minutes: z.number().int().positive(),
  chunks: z.array(lessonChunkSchema).min(1),
});
export const activitySchema = z.object({
  id: text, lesson: text, status: text, title: text, intro: text,
  paths: z.array(z.object({
    id: text, label: text, prompt: text,
    example: text.optional(), scenario: text.optional(),
    modelPoints: z.array(z.object({
      point: text, criterion: text, chunks: texts,
    })).optional(),
  })).min(1),
  rubric: z.array(z.object({
    id: text, description: text, chunks: texts, keywords: texts,
  })).min(1),
  feedbackRules: texts.min(1),
});
export const pathwaySchema = z.object({
  status: text,
  intentions: z.array(z.object({ id: text, label: text, welcome: text })).min(1),
  stages: z.array(z.object({
    id: text, label: text, active: z.boolean(), lessons: texts.optional(),
  })).min(1),
  understandingCheck: z.array(z.object({
    id: text, question: text, options: texts.min(1),
    answerIndex: z.number().int().nonnegative(), chunk: text,
  }).refine((question) => question.answerIndex < question.options.length, {
    message: "answerIndex must reference an option", path: ["answerIndex"],
  })).min(1),
  stuckHints: z.record(text, text),
  nextSteps: z.array(z.object({ id: text, label: text, chunks: texts })).min(1),
  unsupportedFallback: z.object({ message: text, nextStep: text }),
  reminder: z.object({
    optional: z.boolean(), demoOnly: z.boolean(), label: text, preview: text,
  }),
});

export type Source = z.infer<typeof sourceSchema>;
export type Sources = z.infer<typeof sourcesSchema>;
export type LessonChunk = z.infer<typeof lessonChunkSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type Activity = z.infer<typeof activitySchema>;
export type Pathway = z.infer<typeof pathwaySchema>;
