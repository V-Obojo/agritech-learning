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
export const labProgressSchema = z.object({ completed:z.boolean(), score:z.number().nullable(), data:z.unknown().default(null), updatedAt:z.iso.datetime() });
export const progressSchema = z.object({
  celebratedBadges:z.record(z.string(),z.iso.datetime()).default({}),
  labs:z.record(z.string(),labProgressSchema).default({}),
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
  return { celebratedBadges:{}, labs:{}, intention: null, topics: {}, reminderOptIn: {}, wouldReturn: null, lastPath: null, updatedAt: null };
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
  if (accountId || storageFailed) return memory;
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
      try { if(accountId) queueAccountSave(); else window.localStorage.setItem(progressKey, cachedRaw); }
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
  if(accountId) queueAccountSave();
  if (typeof window !== "undefined" && !accountId) {
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

// Account data wins answer conflicts; timestamps decide between equally useful drafts.
export function mergeProgress(guest:Progress,account:Progress):Progress {
  guest=progressSchema.parse(guest);account=progressSchema.parse(account);
  const timestamp=(value:string|null)=>value ? Date.parse(value) : -Infinity;
  const guestNewer=timestamp(guest.updatedAt)>timestamp(account.updatedAt);
  const recent=guestNewer ? guest : account;
  const topics:Progress["topics"]={};
  for(const key of new Set([...Object.keys(guest.topics),...Object.keys(account.topics)])) {
    const g=getTopicProgress(guest,key),a=getTopicProgress(account,key);
    const activity=Boolean(g.activity?.feedback)!==Boolean(a.activity?.feedback)
      ? (g.activity?.feedback ? g.activity : a.activity)
      : (guestNewer ? g.activity ?? a.activity : a.activity ?? g.activity);
    topics[key]={viewed:g.viewed || a.viewed,completed:g.completed || a.completed,checkAnswers:{...g.checkAnswers,...a.checkAnswers},guideQuestionsAsked:Math.max(g.guideQuestionsAsked,a.guideQuestionsAsked),activity};
  }
  const labs:Progress["labs"]={};
  for(const key of new Set([...Object.keys(guest.labs),...Object.keys(account.labs)])) {
    const g=guest.labs[key],a=account.labs[key];
    if(!g || !a) {labs[key]=g ?? a;continue;}
    const latest=timestamp(g.updatedAt)>timestamp(a.updatedAt) ? g : a;
    const best=(g.score ?? -Infinity)>(a.score ?? -Infinity) ? g : (g.score ?? -Infinity)<(a.score ?? -Infinity) ? a : latest;
    labs[key]={...best,completed:g.completed || a.completed,updatedAt:latest.updatedAt};
  }
  const celebratedBadges={...guest.celebratedBadges,...account.celebratedBadges};
  for(const id of Object.keys(guest.celebratedBadges)) if(account.celebratedBadges[id]&&timestamp(guest.celebratedBadges[id])<timestamp(account.celebratedBadges[id])) celebratedBadges[id]=guest.celebratedBadges[id];
  return {celebratedBadges,topics,labs,intention:account.intention ?? guest.intention,reminderOptIn:{...guest.reminderOptIn,...account.reminderOptIn},wouldReturn:account.wouldReturn ?? guest.wouldReturn,lastPath:recent.lastPath ?? (guestNewer ? account.lastPath : guest.lastPath),updatedAt:recent.updatedAt};
}

let accountId:string|null=null;
let revision=0,savedRevision=0;
let saveTimer:ReturnType<typeof setTimeout>|undefined;
let saving:Promise<void>|null=null;
let syncError:string|null=null;
export function configureProgressAccount(id:string|null,initial:Progress=defaultProgress()) {
  if(saveTimer) clearTimeout(saveTimer);
  accountId=id;revision=0;savedRevision=0;syncError=null;
  memory=id ? progressSchema.parse(initial) : defaultProgress();cachedRaw=undefined;storageFailed=false;
}
export function getProgressSyncError() {return syncError;}
function notify() {listeners.forEach(listener=>listener());}
function queueAccountSave() {
  revision++;
  if(saveTimer) clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{void flushAccountProgress().catch(()=>{});},1000);
}
export function flushAccountProgress():Promise<void> {
  if(saving) return saving;
  const id=accountId;
  saving=(async()=>{
    while(id && id===accountId && revision>savedRevision) {
      const version=revision,value=memory;
      const body=JSON.stringify({progress:value});
      const response=await fetch("/api/me/progress",{method:"PUT",headers:{"Content-Type":"application/json"},body,keepalive:new TextEncoder().encode(body).length<60000});
      if(!response.ok) throw new Error("Progress could not sync.");
      if(id===accountId) {savedRevision=version;syncError=null;notify();}
    }
  })().catch(()=>{
    if(id===accountId) {syncError="Your progress could not save to your account. Please retry.";notify();}
    throw new Error("Progress could not sync.");
  }).finally(()=>{saving=null;});
  return saving;
}
export async function hydrateAccountProgress() {
  const id=accountId,version=revision;
  if(!id) return;
  try {
    const response=await fetch("/api/me/progress",{cache:"no-store"});
    if(!response.ok) throw new Error("Progress could not load.");
    const remote=progressSchema.parse(await response.json());
    if(id!==accountId) return;
    memory=revision===version && version===savedRevision ? remote : mergeProgress(remote,memory);
    syncError=null;notify();
  } catch {if(id===accountId) {syncError="Your saved progress could not refresh. Your current work is still available.";notify();}}
}
