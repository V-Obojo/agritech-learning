import { describe,it,expect,vi } from "vitest";
vi.mock("server-only",()=>({}));
import { computeStreak,computeBadges,computeActivitySeries,computeTopicStats,estimateLearningMinutes } from "../../src/lib/insights/calculators";
import { getInsightContent } from "../../src/lib/insights/content";
import { defaultProgress,defaultTopicProgress,mergeProgress,progressSchema,topicKey } from "../../src/lib/progress";
import type { MetricEvent } from "../../src/lib/metrics";
import { defaultLayout,layoutSchema } from "../../src/lib/insights/layout";
const content=getInsightContent(),topic=content.topics[0],now=new Date("2026-10-14T22:30:00Z"),at="2026-10-14T22:00:00Z";
function event(at:string,name:MetricEvent["name"]="lesson_viewed",details:MetricEvent["details"]={}):MetricEvent {return {name,at,details:{subjectId:topic.subjectId,topicId:topic.topicId,...details}};}
describe("learning insights",()=>{
  it("counts distinct Lagos days across midnight, sorting duplicates and ignoring navigation/future events",()=>{
    const events=[event("2026-10-14T23:01:00Z"),event("2026-10-14T22:59:00Z"),event("2026-10-14T23:03:00Z"),event("2026-10-18T10:00:00Z"),event("2026-10-13T10:00:00Z","area_opened")];
    expect(computeStreak(events,new Date("2026-10-15T00:00:00Z"))).toEqual({current:2,longest:2,activeDays:["2026-10-14","2026-10-15"]});
    expect(computeStreak(events,new Date("2026-10-15T00:00:00Z"),"UTC").longest).toBe(1);
  });
  it("keeps yesterday's streak alive, breaks older runs, handles year boundaries and empty events",()=>{
    const events=[event("2025-12-30T10:00:00Z"),event("2025-12-31T10:00:00Z"),event("2026-01-01T10:00:00Z")];
    expect(computeStreak(events,new Date("2026-01-02T10:00:00Z"))).toMatchObject({current:3,longest:3});
    expect(computeStreak(events,new Date("2026-01-03T10:00:00Z"))).toMatchObject({current:0,longest:3});
    expect(computeStreak([],now)).toEqual({current:0,longest:0,activeDays:[]});
  });
  it("fills chart gaps and includes only learning events in the requested Lagos window",()=>{
    expect(computeActivitySeries([event("2026-10-12T23:30:00Z"),event("2026-10-13T09:00:00Z"),event(at,"subject_opened"),event("2026-10-15T10:00:00Z")],3,now)).toEqual([{day:"2026-10-12",count:0},{day:"2026-10-13",count:2},{day:"2026-10-14",count:0}]);
    expect(computeActivitySeries([],0,now)).toEqual([]);
  });
  for(const badge of content.badges.badges) it(`evaluates content rule ${badge.rule.type} for ${badge.id}, with earned date`,()=>{
    const p=defaultProgress(),events:MetricEvent[]=[],r=badge.rule;const key=topicKey(topic.subjectId,topic.topicId);
    expect(computeBadges({badges:[badge]},p,[],content.topics,now)[0]).toMatchObject({earned:false,earnedAt:null});
    p.topics[key]=defaultTopicProgress();p.updatedAt=at;
    switch(r.type) {
      case "first-topic-started":p.topics[key].viewed=true;events.push(event(at));break;
      case "topic-complete":p.topics[topicKey(r.subjectId,r.topicId)]={...defaultTopicProgress(),completed:true};events.push(event(at,"activity_completed",{subjectId:r.subjectId,topicId:r.topicId}));break;
      case "lab-complete":p.labs[r.labId]={completed:true,score:1,data:null,updatedAt:at};break;
      case "streak":for(let i=r.days-1;i>=0;i--) events.push(event(new Date(Date.parse(at)-i*86400000).toISOString()));break;
      case "guide-questions":p.topics[key].guideQuestionsAsked=r.count;for(let i=0;i<r.count;i++) events.push(event(at,"guide_asked"));break;
      case "all-paths-tried":for(const pathId of topic.pathIds) events.push(event(at,"activity_submitted",{pathId}));break;
      case "chose-pause":p.wouldReturn="no";events.push(event(at,"would_return",{answer:"no"}));break;
      case "night-session":events.push(event(at));break;
      case "all-live-topics":for(const t of content.topics.filter(t=>t.subjectId===r.subjectId)) p.topics[topicKey(t.subjectId,t.topicId)]={...defaultTopicProgress(),completed:true};break;
    }
    const result=computeBadges({badges:[badge]},p,events,content.topics,now)[0];expect(result.earned).toBe(true);expect(Number.isFinite(Date.parse(result.earnedAt!))).toBe(true);
  });
  it("does not combine activity paths across different topics and requires all live topics",()=>{
    const badge=content.badges.badges.find(b=>b.rule.type==="all-paths-tried")!,events=topic.pathIds.map((pathId,i)=>event(at,"activity_submitted",{pathId,topicId:i ? content.topics[1].topicId : topic.topicId}));
    expect(computeBadges({badges:[badge]},defaultProgress(),events,content.topics,now)[0].earned).toBe(false);
    const p=defaultProgress();p.topics[topicKey(topic.subjectId,topic.topicId)]={...defaultTopicProgress(),completed:true};
    expect(computeBadges(content.badges,p,[],content.topics,now).find(b=>b.rule.type==="all-live-topics")!.earned).toBe(false);
  });
  it("retains an earned badge date outside the event window and merges celebrations without replay",()=>{
    const badge=content.badges.badges[0],p=defaultProgress(),other=defaultProgress();p.celebratedBadges[badge.id]="2025-10-01T10:00:00Z";other.celebratedBadges[badge.id]=at;
    const merged=mergeProgress(p,other);expect(merged.celebratedBadges[badge.id]).toBe(p.celebratedBadges[badge.id]);
    expect(computeBadges(content.badges,merged,[],content.topics,now)[0]).toMatchObject({earned:true,earnedAt:p.celebratedBadges[badge.id]});
    const legacy={...defaultProgress()} as Record<string,unknown>;delete legacy.celebratedBadges;expect(progressSchema.parse(legacy).celebratedBadges).toEqual({});
  });
  it("calculates topic status, correct check scores, lab completion, and reading-time estimate",()=>{
    const p=defaultProgress(),key=topicKey(topic.subjectId,topic.topicId);p.topics[key]={...defaultTopicProgress(),viewed:true,checkAnswers:{[topic.checks[0].id]:topic.checks[0].answerIndex}};
    const lab=content.labs[0];p.labs[lab.id]={completed:true,score:5,data:null,updatedAt:at};
    expect(computeTopicStats(p,content.topics)[0]).toMatchObject({status:"in-progress",checkScore:1,activityDone:false});
    expect(computeTopicStats(p,content.topics).find(t=>t.topicId===lab.topicId)!.labsDone).toBe(1);
    expect(estimateLearningMinutes(p,content.topics)).toBe(topic.estimated_minutes+3);expect(estimateLearningMinutes(defaultProgress(),content.topics)).toBe(0);
    p.topics[key].completed=true;expect(computeTopicStats(p,content.topics)[0]).toMatchObject({status:"done",activityDone:true});
  });
  it("validates a complete, unique widget list with explicit visibility",()=>{
    const layout=defaultLayout();expect(layoutSchema.parse(layout)).toEqual(layout);
    for(const invalid of [layout.slice(1),[...layout.slice(1),layout[1]],layout.map(w=>({...w,id:"unknown"})),layout.map(w=>({...w,visible:"yes"}))]) expect(layoutSchema.safeParse(invalid).success).toBe(false);
  });
});
