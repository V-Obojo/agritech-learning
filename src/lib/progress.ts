import { z } from "zod";
import { feedbackResponseSchema } from "./feedback/types";

export const progressKey = "agri-progress-v1";
export const progressSchema = z.object({
  intention: z.enum(["curious", "considering", "student"]).nullable(),
  lessonViewed: z.boolean(),
  checkAnswers: z.record(z.string(), z.number().int().nonnegative()),
  guideQuestionsAsked: z.number().int().nonnegative(),
  activity: z.object({
    pathId: z.enum(["observe", "questions", "fictional"]),
    response: z.string().max(2000),
    feedback: feedbackResponseSchema.nullable(),
  }).nullable(),
  reminderOptIn: z.boolean(),
  wouldReturn: z.enum(["yes", "maybe", "no"]).nullable(),
  updatedAt: z.iso.datetime().nullable(),
});
export type Progress = z.infer<typeof progressSchema>;
export function defaultProgress(): Progress {
  return { intention: null, lessonViewed: false, checkAnswers: {}, guideQuestionsAsked: 0,
    activity: null, reminderOptIn: false, wouldReturn: null, updatedAt: null };
}
export const serverProgress = defaultProgress();
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
    if (!raw) { memory = defaultProgress(); return memory; }
    try { memory = progressSchema.parse(JSON.parse(raw)); }
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
  listeners.forEach((listener) => listener());
  return memory;
}
export function updateProgress(patch: Partial<Progress>) {
  return saveProgress({ ...loadProgress(), ...patch });
}
export function resetProgress() {
  memory = defaultProgress(); cachedRaw = null;
  if (typeof window !== "undefined") {
    try { window.localStorage.removeItem(progressKey); }
    catch { storageFailed = true; }
  }
  listeners.forEach((listener) => listener());
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
export function resumePath(progress: Progress) {
  if (progress.activity?.feedback?.completed) return "/next";
  if (progress.activity) return "/activity";
  return "/lesson";
}
