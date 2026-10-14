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
  blocks: z.array(z.discriminatedUnion("type",[
    z.object({type:z.literal("text"),text}),
    z.object({type:z.literal("figure"),mediaId:text}),
    z.object({type:z.literal("lab"),labId:text}),
  ])).optional(),
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
export const topicConfigSchema = z.object({
  status: text,
  welcome: z.record(text, text),
  starterQuestions: texts,
  synonyms: z.record(text, text),
  defaultNextStep: z.record(text, text),
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
const availability = z.enum(["live", "coming-soon"]);
export const catalogSchema = z.object({
  status: text,
  product: z.object({ name: text, parent: text, tagline: text, pitch: text, region: text, heroEyebrow: text, heroHeadline: text, heroSubhead: text, supportContact: text }),
  intentions: z.array(z.object({ id: text, label: text })).min(1),
  areas: z.array(z.object({
    id: text, slug: text, label: text, blurb: text, status: availability,
    subjects: z.array(z.object({ id: text, slug: text, label: text, blurb: text, status: availability, path: text.optional() })),
  })).min(1),
});
export const subjectPathSchema = z.object({
  subject: text, status: text, title: text, intro: text, whatYouWillLearn: texts,
  hubCard: z.object({ title: text, note: text, intentionPrompt: text }),
  topics: z.array(z.object({ id: text, slug: text, order: z.number().int().positive(), title: text, summary: text, status: availability })).min(1),
});
export type Catalog = z.infer<typeof catalogSchema>;
export type SubjectPath = z.infer<typeof subjectPathSchema>;
export type TopicConfig = z.infer<typeof topicConfigSchema>;
export type Topic = { meta: SubjectPath["topics"][number]; lesson: Lesson; config: TopicConfig; activity: Activity };

// Compatibility props for the existing UI until route-driven navigation.
export type Pathway = TopicConfig & { topicId: string; subjectId: string; title: string; summary: string; estimatedMinutes: number; intentions: (Catalog["intentions"][number] & { welcome: string })[]; stages: { id: string; label: string; active: boolean }[] };
