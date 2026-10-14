import { z } from "zod";
export const metricsKey = "agri-events-v1";
const topicEvents = new Set(["topic_opened", "lesson_viewed", "check_answered", "guide_asked", "guide_unsupported", "help_requested", "activity_submitted", "activity_completed", "would_return"]);
export const eventSchema = z.object({
  name: z.enum(["intention_chosen", "area_opened", "subject_opened", "topic_opened", "lesson_viewed", "check_answered", "guide_asked", "guide_unsupported", "help_requested", "activity_submitted", "activity_completed", "would_return", "lab_started", "lab_progress", "lab_completed"]),
  at: z.iso.datetime(),
  details: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
}).superRefine((event,ctx)=>{
  const required = event.name.startsWith("lab_") ? ["labId","subjectId","topicId"] : topicEvents.has(event.name) ? ["subjectId","topicId"] : event.name==="subject_opened" ? ["areaId","subjectId"] : event.name==="area_opened" ? ["areaId"] : [];
  for(const field of required) if(typeof event.details[field]!=="string" || !String(event.details[field]).trim()) ctx.addIssue({code:"custom",path:["details",field],message:`${field} is required for ${event.name}`});
});
export type MetricEvent = z.infer<typeof eventSchema>;
let memory: MetricEvent[] = [];
let storageFailed = false;
const listeners=new Set<()=>void>();
export function subscribeMetrics(listener:()=>void) {listeners.add(listener);return ()=>{listeners.delete(listener);};}
export function getEvents(): MetricEvent[] {
  if(accountId || typeof window==="undefined" || storageFailed) return memory;
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
    try {if(accountId) {pending.push(event);scheduleEvents();} else window.localStorage.setItem(metricsKey,JSON.stringify(memory));}
    catch {storageFailed=true;}
    listeners.forEach(listener=>listener());
  } catch { /* Metrics must never interrupt learning. */ }
}
export function resetMetrics() {
  memory=[];
  if(typeof window!=="undefined" && !accountId) {
    try {window.localStorage.removeItem(metricsKey);}
    catch {storageFailed=true;}
  }
  listeners.forEach(listener=>listener());
}

let accountId:string|null=null;
let pending:MetricEvent[]=[];
let timer:ReturnType<typeof setTimeout>|undefined;
let sending:Promise<void>|null=null;
export function configureMetricsAccount(id:string|null,initial:MetricEvent[]=[]) {
  if(timer) clearTimeout(timer);
  accountId=id;pending=[];memory=id ? initial : [];storageFailed=false;
}
function scheduleEvents() {if(timer) clearTimeout(timer);timer=setTimeout(()=>{void flushAccountEvents().catch(()=>{if(accountId) {timer=setTimeout(scheduleEvents,4000);}});},1000);}
export function flushAccountEvents():Promise<void> {
  if(sending) return sending;
  const id=accountId;
  sending=(async()=>{
    while(id && id===accountId && pending.length) {
      const batch=pending.slice(0,200);
      const body=JSON.stringify({events:batch});
      const response=await fetch("/api/me/events",{method:"POST",headers:{"Content-Type":"application/json"},body,keepalive:new TextEncoder().encode(body).length<60000});
      if(!response.ok) throw new Error("Events could not sync.");
      if(id===accountId) pending.splice(0,batch.length);
    }
  })().finally(()=>{sending=null;});
  return sending;
}
