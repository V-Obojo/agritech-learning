import { describe,it,expect } from "vitest";
import { defaultProgress,defaultTopicProgress,mergeProgress,progressSchema,type Progress } from "../../src/lib/progress";
const early="2026-10-01T10:00:00.000Z",late="2026-10-02T10:00:00.000Z";
function pair() {
  const guest:Progress={...defaultProgress(),updatedAt:late,lastPath:"/a/s/t/activity",intention:"guest",topics:{"s/t":{...defaultTopicProgress(),viewed:true,checkAnswers:{shared:0,guest:1},guideQuestionsAsked:4,completed:true,activity:{pathId:"p",response:"recent",feedback:null}}}};
  const account:Progress={...defaultProgress(),updatedAt:early,lastPath:"/a/s/t",intention:"account",topics:{"s/t":{...defaultTopicProgress(),checkAnswers:{shared:2,account:3},guideQuestionsAsked:2,activity:{pathId:"p",response:"older",feedback:null}}}};
  return {guest,account};
}
describe("merge guest learning into account",()=>{
  it("ORs viewed/completed, unions answers with account priority, and takes maximum guide count",()=>{
    const {guest,account}=pair(),topic=mergeProgress(guest,account).topics["s/t"];
    expect(topic.viewed && topic.completed).toBe(true);expect(topic.checkAnswers).toEqual({shared:2,guest:1,account:3});expect(topic.guideQuestionsAsked).toBe(4);
    expect(mergeProgress(account,guest).topics["s/t"].completed).toBe(true);
  });
  it("keeps all independent topics without mutating either input",()=>{
    const {guest,account}=pair();account.topics.other=defaultTopicProgress();const before=JSON.stringify({guest,account});
    expect(Object.keys(mergeProgress(guest,account).topics).sort()).toEqual(["other","s/t"]);expect(JSON.stringify({guest,account})).toBe(before);
  });
  it("chooses the activity with feedback ahead of a newer draft",()=>{
    const {guest,account}=pair();account.topics["s/t"].activity!.feedback={completed:false,strengths:[],toConsider:[],hint:"Authored hint",nextStep:{id:"next",label:"Next"},mode:"mock"};
    expect(mergeProgress(guest,account).topics["s/t"].activity?.response).toBe("older");
  });
  it("chooses the most recent activity when feedback priority is equal",()=>{
    const {guest,account}=pair();expect(mergeProgress(guest,account).topics["s/t"].activity?.response).toBe("recent");
    account.updatedAt="2026-10-03T10:00:00.000Z";expect(mergeProgress(guest,account).topics["s/t"].activity?.response).toBe("older");
  });
  it("takes account intention or guest fallback and the most recent lastPath",()=>{
    const {guest,account}=pair();let merged=mergeProgress(guest,account);expect(merged.intention).toBe("account");expect(merged.lastPath).toBe(guest.lastPath);
    account.intention=null;account.updatedAt="2026-10-03T10:00:00.000Z";merged=mergeProgress(guest,account);expect(merged.intention).toBe("guest");expect(merged.lastPath).toBe(account.lastPath);
  });
  it("preserves guest path when a newer empty account has no path",()=>{
    const {guest,account}=pair();account.updatedAt="2026-10-03T10:00:00.000Z";account.lastPath=null;expect(mergeProgress(guest,account).lastPath).toBe(guest.lastPath);
  });
  it("merges labs by best score and completed OR, retaining best result data",()=>{
    const {guest,account}=pair();guest.labs.lab={completed:false,score:8,data:{result:"best"},updatedAt:early};account.labs.lab={completed:true,score:4,data:{result:"newer"},updatedAt:late};
    const lab=mergeProgress(guest,account).labs.lab;expect(lab).toEqual({completed:true,score:8,data:{result:"best"},updatedAt:late});
    guest.labs.only={completed:false,score:null,data:null,updatedAt:early};account.labs.lab.score=null;expect(mergeProgress(guest,account).labs.only.score).toBeNull();expect(mergeProgress(guest,account).labs.lab.score).toBe(8);
  });
  it("uses most recent lab data for tied/null scores and defaults old progress to no labs",()=>{
    const {guest,account}=pair();guest.labs.lab={completed:false,score:null,data:"older",updatedAt:early};account.labs.lab={completed:false,score:null,data:"newer",updatedAt:late};
    expect(mergeProgress(guest,account).labs.lab.data).toBe("newer");const old={...defaultProgress()};delete (old as Partial<Progress>).labs;expect(progressSchema.parse(old).labs).toEqual({});
  });
});

it("compares timestamps chronologically when fractional-second formatting differs",()=>{
  const {guest,account}=pair();guest.updatedAt="2026-10-02T10:00:00Z";account.updatedAt="2026-10-02T10:00:00.500Z";
  guest.labs.lab={completed:false,score:null,data:"guest",updatedAt:guest.updatedAt};account.labs.lab={completed:false,score:null,data:"account",updatedAt:account.updatedAt};
  const merged=mergeProgress(guest,account);expect(merged.lastPath).toBe(account.lastPath);expect(merged.labs.lab.data).toBe("account");
});
