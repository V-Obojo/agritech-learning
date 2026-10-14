import { z } from "zod";
import { getTopicProgress, topicKey, topicStatus, type Progress } from "../progress";
import type { MetricEvent } from "../metrics";

const ruleSchema=z.discriminatedUnion("type",[
  z.object({type:z.literal("topic-complete"),subjectId:z.string(),topicId:z.string()}),
  z.object({type:z.literal("lab-complete"),labId:z.string()}),
  z.object({type:z.literal("streak"),days:z.number().int().positive()}),
  z.object({type:z.literal("guide-questions"),count:z.number().int().positive()}),
  z.object({type:z.literal("night-session"),afterHour:z.number().int().min(0).max(23)}),
  z.object({type:z.literal("all-live-topics"),subjectId:z.string()}),
  z.object({type:z.literal("all-paths-tried")}),
  z.object({type:z.literal("chose-pause")}),
  z.object({type:z.literal("first-topic-started")}),
]);
export const badgesSchema=z.object({badges:z.array(z.object({id:z.string(),label:z.string(),description:z.string(),emoji:z.string(),rule:ruleSchema}))});
export type BadgeDefinition=z.infer<typeof badgesSchema>["badges"][number];
export type InsightTopic={subjectId:string;topicId:string;title:string;subjectTitle:string;url:string;hubUrl:string;estimated_minutes:number;checks:{id:string;answerIndex:number}[];pathIds:string[];labIds:string[]};
const learningNames=new Set(["topic_opened","lesson_viewed","check_answered","guide_asked","guide_unsupported","activity_submitted","activity_completed","help_requested","would_return"]);
export function dayKey(date:Date|string,timeZone="Africa/Lagos") {
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date(date));
  return ["year","month","day"].map(type=>parts.find(p=>p.type===type)!.value).join("-");
}
function shiftDay(day:string,amount:number) {return new Date(Date.parse(day+"T12:00:00Z")+amount*86400000).toISOString().slice(0,10);}
function learning(events:MetricEvent[],now:Date) {return events.filter(e=>learningNames.has(e.name)&&Number.isFinite(Date.parse(e.at))&&Date.parse(e.at)<=now.getTime()).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));}
export function computeStreak(events:MetricEvent[],now:Date,timeZone="Africa/Lagos") {
  const activeDays=[...new Set(learning(events,now).map(e=>dayKey(e.at,timeZone)))].sort();
  let longest=0,run=0,previous="";
  for(const day of activeDays) {run=shiftDay(previous||day,1)===day ? run+1 : 1;longest=Math.max(longest,run);previous=day;}
  const today=dayKey(now,timeZone);let cursor=activeDays.includes(today) ? today : shiftDay(today,-1),current=0;
  const days=new Set(activeDays);while(days.has(cursor)) {current++;cursor=shiftDay(cursor,-1);}
  return {current,longest,activeDays};
}
export function computeActivitySeries(events:MetricEvent[],days=14,now=new Date()) {
  const counts=new Map<string,number>();for(const event of learning(events,now)) {const day=dayKey(event.at);counts.set(day,(counts.get(day)||0)+1);}
  return Array.from({length:Math.max(0,days)},(_,i)=>{const day=shiftDay(dayKey(now),i-days+1);return {day,count:counts.get(day)||0};});
}
export function computeTopicStats(progress:Progress,paths:InsightTopic[]) {
  return paths.map(topic=>{const key=topicKey(topic.subjectId,topic.topicId),saved=getTopicProgress(progress,key);return {...topic,status:topicStatus(progress,key),checkScore:topic.checks.filter(q=>saved.checkAnswers[q.id]===q.answerIndex).length,checkTotal:topic.checks.length,activityDone:saved.completed||Boolean(saved.activity?.feedback?.completed),labsDone:topic.labIds.filter(id=>progress.labs[id]?.completed).length};});
}
export function estimateLearningMinutes(progress:Progress,topics:InsightTopic[]) {
  return topics.reduce((sum,t)=>sum+(getTopicProgress(progress,topicKey(t.subjectId,t.topicId)).viewed ? t.estimated_minutes : 0),0)+Object.values(progress.labs).filter(l=>l.completed).length*3;
}
export function computeBadges(badgesJson:{badges:BadgeDefinition[]},progress:Progress,events:MetricEvent[],liveTopics:InsightTopic[],now:Date) {
  const past=learning(events,now),streak=computeStreak(events,now);
  return badgesJson.badges.map(badge=>{
    const r=badge.rule;let earned=false,date:string|undefined;
    const matching=(name:string,subjectId?:string,topicId?:string)=>past.find(e=>e.name===name&&(!subjectId||e.details.subjectId===subjectId)&&(!topicId||e.details.topicId===topicId))?.at;
    switch(r.type) {
      case "first-topic-started": earned=Object.keys(progress.topics).some(key=>topicStatus(progress,key)!=="not-started");date=past[0]?.at;break;
      case "topic-complete": {const rule=r;earned=Boolean(progress.topics[topicKey(rule.subjectId,rule.topicId)]?.completed);date=matching("activity_completed",rule.subjectId,rule.topicId);break;}
      case "lab-complete": {const lab=progress.labs[r.labId];earned=Boolean(lab?.completed);date=lab?.updatedAt;break;}
      case "streak": {const days=r.days;earned=streak.longest>=days;let run=0,prev="";for(const day of streak.activeDays) {run=shiftDay(prev||day,1)===day ? run+1 : 1;prev=day;if(run>=days) {date=past.find(e=>dayKey(e.at)===day)?.at;break;}}break;}
      case "guide-questions": {const count=r.count;earned=Math.max(Object.values(progress.topics).reduce((n,t)=>n+t.guideQuestionsAsked,0),past.filter(e=>e.name==="guide_asked").length)>=count;date=past.filter(e=>e.name==="guide_asked")[count-1]?.at;break;}
      case "all-live-topics": {const topics=liveTopics.filter(t=>t.subjectId===r.subjectId);earned=topics.length>0&&topics.every(t=>progress.topics[topicKey(t.subjectId,t.topicId)]?.completed);date=past.filter(e=>e.name==="activity_completed"&&e.details.subjectId===r.subjectId).at(-1)?.at;break;}
      case "all-paths-tried": {const dates=liveTopics.flatMap(t=>{const tries=t.pathIds.map(id=>past.find(e=>e.name==="activity_submitted"&&e.details.subjectId===t.subjectId&&e.details.topicId===t.topicId&&e.details.pathId===id)?.at);return tries.length&&tries.every(Boolean) ? [tries.filter((d):d is string=>Boolean(d)).sort().at(-1)!] : [];}).sort();earned=dates.length>0;date=dates[0];break;}
      case "chose-pause": {const event=events.find(e=>Date.parse(e.at)<=now.getTime()&&((e.name==="would_return"&&e.details.answer==="no")||e.details.paused===true));earned=Boolean(event)||progress.wouldReturn==="no";date=event?.at;break;}
      case "night-session": {const event=past.find(e=>Number(new Intl.DateTimeFormat("en-GB",{timeZone:"Africa/Lagos",hour:"2-digit",hourCycle:"h23"}).format(new Date(e.at)))>=r.afterHour);earned=Boolean(event);date=event?.at;break;}
    }
    earned=earned||Boolean(progress.celebratedBadges[badge.id]);
    return {...badge,earned,earnedAt:earned ? progress.celebratedBadges[badge.id] ?? date ?? progress.updatedAt ?? now.toISOString() : null};
  });
}
