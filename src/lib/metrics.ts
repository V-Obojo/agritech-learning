import { z } from "zod";
export const metricsKey = "agri-events-v1";
const topicEvents = new Set(["topic_opened", "lesson_viewed", "check_answered", "guide_asked", "guide_unsupported", "help_requested", "activity_submitted", "activity_completed", "would_return"]);
const eventSchema = z.object({
  name: z.enum(["intention_chosen", "area_opened", "subject_opened", "topic_opened", "lesson_viewed", "check_answered", "guide_asked", "guide_unsupported", "help_requested", "activity_submitted", "activity_completed", "would_return"]),
  at: z.iso.datetime(),
  details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
}).superRefine((event,ctx)=>{
  const required = topicEvents.has(event.name) ? ["subjectId","topicId"] : event.name==="subject_opened" ? ["areaId","subjectId"] : event.name==="area_opened" ? ["areaId"] : [];
  for(const field of required) if(typeof event.details[field]!=="string" || !String(event.details[field]).trim()) ctx.addIssue({code:"custom",path:["details",field],message:`${field} is required for ${event.name}`});
});
export type MetricEvent = z.infer<typeof eventSchema>;
let memory: MetricEvent[] = [];
let storageFailed = false;
export function getEvents(): MetricEvent[] {
  if(typeof window==="undefined" || storageFailed) return memory;
  try {
    const raw=window.localStorage.getItem(metricsKey);
    // Retain valid records even when an older event lacks the new identifiers.
    try {
      const values:unknown=raw ? JSON.parse(raw) : [];
      memory=Array.isArray(values) ? values.flatMap(value=>{const parsed=eventSchema.safeParse(value);return parsed.success ? [parsed.data] : [];}) : [];
    } catch {memory=[];}
  } catch {storageFailed=true;}
  return memory;
}
export function recordEvent(name: MetricEvent["name"], details: MetricEvent["details"] = {}) {
  if(typeof window==="undefined") return;
  try {
    const event=eventSchema.parse({name,details,at:new Date().toISOString()});
    memory=[...getEvents(),event];
    try {window.localStorage.setItem(metricsKey,JSON.stringify(memory));}
    catch {storageFailed=true;}
  } catch { /* Metrics must never interrupt learning. */ }
}
export function resetMetrics() {
  memory=[];
  if(typeof window!=="undefined") {
    try {window.localStorage.removeItem(metricsKey);}
    catch {storageFailed=true;}
  }
}
