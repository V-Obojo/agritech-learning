import { z } from "zod";

export const metricsKey = "agri-events-v1";
const eventSchema = z.object({
  name: z.enum(["intention_chosen", "lesson_viewed", "check_answered", "guide_asked",
    "guide_unsupported", "help_requested", "activity_submitted", "activity_completed", "would_return"]),
  at: z.iso.datetime(),
  details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
});
export type MetricEvent = z.infer<typeof eventSchema>;
let memory: MetricEvent[] = [];
let storageFailed = false;

export function getEvents(): MetricEvent[] {
  if (typeof window === "undefined" || storageFailed) return memory;
  try {
    const raw = window.localStorage.getItem(metricsKey);
    try { memory = raw ? z.array(eventSchema).parse(JSON.parse(raw)) : []; }
    catch { memory = []; }
  } catch { storageFailed = true; }
  return memory;
}

export function recordEvent(name: MetricEvent["name"], details: MetricEvent["details"] = {}) {
  if (typeof window === "undefined") return;
  try {
    const event = eventSchema.parse({ name, details, at: new Date().toISOString() });
    memory = [...getEvents(), event];
    try { window.localStorage.setItem(metricsKey, JSON.stringify(memory)); }
    catch { storageFailed = true; }
  } catch { /* Metrics must never interrupt learning. */ }
}

export function resetMetrics() {
  memory = [];
  if (typeof window !== "undefined") {
    try { window.localStorage.removeItem(metricsKey); }
    catch { storageFailed = true; }
  }
}
