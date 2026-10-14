import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { POST as guide } from "../guide/route";
import { POST as feedback } from "../feedback/route";
import { POST as help } from "./route";
import { getTopic, getSubjectPath, listLiveTopics } from "@/lib/content";
function request(body: unknown) { return new Request("http://localhost/api", {method: "POST", body: JSON.stringify(body)}); }
beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => { throw new Error("No network in tests"); })));
afterEach(() => vi.unstubAllGlobals());
describe("topic API contracts", () => {
  for (const [name, handler, fields] of [["guide",guide,{ question: "What do I need?" }],["feedback",feedback,{pathId:"fictional",response:"idk"}],["help",help,{step:"guide"}]] as const) {
    it.each(["missing", ...getSubjectPath("fish-farming").topics.filter(topic=>topic.status==="coming-soon").map(topic=>topic.id)])(`${name} returns 400 for unavailable topic %s`, async topicId => {
      const result = await handler(request({ topicId, ...fields })); expect(result.status).toBe(400); expect(await result.json()).toEqual({error: expect.any(String)});
    });
    it(`${name} requires topicId`, async () => { expect((await handler(request(fields))).status).toBe(400); });
    it(`${name} rejects a mismatched subject`, async () => { expect((await handler(request({topicId:"water",subjectId:"poultry",...fields}))).status).toBe(400); });
  }
  it.each(listLiveTopics().map(topic=>topic.topicId))("help serves all authored steps for %s", async topicId => {
    const topic = getTopic("fish-farming",topicId);
    for (const [step,hint] of Object.entries(topic.config.stuckHints)) {
      const response = await help(request({topicId,step})); expect(response.status).toBe(200); expect(await response.json()).toEqual({hint});
    }
    expect((await help(request({topicId,step:"unknown"}))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("help explains the first topic with local guide citations", async () => {
    const response = await help(request({topicId:"what-is-fish-farming",step:"guide",question:"What do I need to start fish farming?"}));
    expect(response.status).toBe(200); const result = await response.json();
    expect(result.explanation.supported).toBe(true); expect(result.explanation.citations.some((citation: {chunkId: string}) => citation.chunkId === "wf-05")).toBe(true);
  });
  it("guide serves the first topic via a Request", async () => {
    const response = await guide(request({topicId:"what-is-fish-farming",question:"What do I need to start fish farming?"}));
    expect(response.status).toBe(200); const result = await response.json(); expect(result.supported).toBe(true); expect(result.citations.some((citation: {chunkId: string}) => citation.chunkId === "wf-05")).toBe(true);
  });
  it("feedback serves the reflect path and rejects a path from another topic", async () => {
    const topic = getTopic("fish-farming","what-is-fish-farming");
    const response = await feedback(request({topicId:topic.meta.id,pathId:"reflect",response:topic.activity.paths[0].example}));
    expect(response.status).toBe(200); expect((await response.json()).completed).toBe(true);
    expect((await feedback(request({topicId:topic.meta.id,pathId:"observe",response:"idk"}))).status).toBe(400);
  });
});
