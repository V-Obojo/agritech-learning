import { z } from "zod";
import { feedbackResponseSchema } from "./feedback/types";

export const progressKey = "agri-progress-v2";
export const topicProgressSchema = z.object({
  viewed: z.boolean(),
  checkAnswers: z.record(z.string(), z.number().int().nonnegative()),
  guideQuestionsAsked: z.number().int().nonnegative(),
  activity: z.object({ pathId: z.string().min(1), response: z.string().max(2000), feedback: feedbackResponseSchema.nullable() }).nullable(),
  completed: z.boolean(),
});
export const progressSchema = z.object({
  intention: z.string().trim().min(1).nullable(),
  topics: z.record(z.string(), topicProgressSchema),
  reminderOptIn: z.record(z.string(), z.boolean()),
  wouldReturn: z.enum(["yes", "maybe", "no"]).nullable(),
  lastPath: z.string().regex(/^\/(?!\/)/).nullable(),
  updatedAt: z.iso.datetime().nullable(),
});
export type Progress = z.infer<typeof progressSchema>;
export type TopicProgress = z.infer<typeof topicProgressSchema>;
export function defaultTopicProgress(): TopicProgress {
  return { viewed: false, checkAnswers: {}, guideQuestionsAsked: 0, activity: null, completed: false };
}
export function defaultProgress(): Progress {
  return { intention: null, topics: {}, reminderOptIn: {}, wouldReturn: null, lastPath: null, updatedAt: null };
}
export function topicKey(subjectId: string, topicId: string) { return `${subjectId}/${topicId}`; }
export function topicStatus(progress: Progress, key: string): "done" | "in-progress" | "not-started" {
  const topic = progress.topics[key];
  if (topic?.completed) return "done";
  if (topic && (topic.viewed || topic.activity || topic.guideQuestionsAsked || Object.keys(topic.checkAnswers).length)) return "in-progress";
  return "not-started";
}
export const serverProgress = defaultProgress();
const emptyTopic = defaultTopicProgress();
export function getTopicProgress(progress: Progress, key: string): TopicProgress { return progress.topics[key] ?? emptyTopic; }
let memory = defaultProgress();
let cachedRaw: string | null | undefined;
let storageFailed = false;
const listeners = new Set<() => void>();
export function loadProgress(): Progress {
  if (typeof window === "undefined") return serverProgress;
  if (storageFailed) return memory;
  try {
    const raw = window.localStorage.getItem(progressKey);
    if (raw === cachedRaw) return memory;
    cachedRaw = raw;
    try { memory = raw ? progressSchema.parse(JSON.parse(raw)) : defaultProgress(); }
    catch { memory = defaultProgress(); }
  } catch { storageFailed = true; }
  return memory;
}
export function saveProgress(value: Progress): Progress {
  try {
    memory = progressSchema.parse({ ...value, updatedAt: new Date().toISOString() });
    cachedRaw = JSON.stringify(memory);
    if (typeof window !== "undefined") {
      try { window.localStorage.setItem(progressKey, cachedRaw); }
      catch { storageFailed = true; }
    }
  } catch { return memory; }
  listeners.forEach(listener => listener());
  return memory;
}
export function updateProgress(patch: Partial<Progress>) { return saveProgress({ ...loadProgress(), ...patch }); }
export function updateTopicProgress(key: string, patch: Partial<TopicProgress>) {
  const progress = loadProgress();
  return saveProgress({ ...progress, topics: { ...progress.topics, [key]: { ...getTopicProgress(progress, key), ...patch } } });
}
export function visitTopic(key: string, lastPath: string, viewed = false) {
  const progress = loadProgress();
  const topic = getTopicProgress(progress, key);
  return saveProgress({ ...progress, lastPath, topics: { ...progress.topics, [key]: { ...topic, viewed: topic.viewed || viewed } } });
}
export function resetProgress() {
  memory = defaultProgress(); cachedRaw = null;
  if (typeof window !== "undefined") {
    try { window.localStorage.removeItem(progressKey); }
    catch { storageFailed = true; }
  }
  listeners.forEach(listener => listener());
}
export function subscribeProgress(listener: () => void) {
  listeners.add(listener);
  function changed() { cachedRaw = undefined; listener(); }
  if (typeof window !== "undefined") window.addEventListener("storage", changed);
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", changed);
  };
}
export function resumePath(progress: Progress) { return progress.lastPath ?? "/"; }
