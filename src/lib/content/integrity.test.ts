import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getCatalog, getTopic, getSources } from "./index";
import { checkContentIntegrity, type ContentIntegrityInput } from "./integrity";
function fixture(): ContentIntegrityInput {
  return structuredClone({ catalog: getCatalog(), sources: getSources(), topics: [getTopic("fish-farming", "water"), getTopic("fish-farming", "what-is-fish-farming")] });
}
describe("checkContentIntegrity", () => {
  it("returns no problems for all current live content", () => { expect(checkContentIntegrity()).toEqual([]); });
  it("catches unknown and missing sources", () => {
    const input = fixture(); input.topics[0].lesson.chunks[0].sourceIds = ["missing-source"];
    expect(checkContentIntegrity(input)).toContain("Chunk wa-01 references unknown source id: missing-source");
    input.topics[0].lesson.chunks[0].sourceIds = [];
    expect(checkContentIntegrity(input)).toContain("Chunk wa-01 has no sources");
  });
  it("catches duplicate chunk ids across topics", () => {
    const input = fixture(); input.topics[1].lesson.chunks.push(structuredClone(input.topics[0].lesson.chunks[0]));
    expect(checkContentIntegrity(input)).toContain("Duplicate chunk id: wa-01");
  });
  it.each(["rubric", "modelPoints", "understandingCheck", "nextSteps"] as const)("catches a cross-topic reference in %s", location => {
    const input = fixture(); const topic = input.topics[0];
    if(location === "rubric") topic.activity.rubric[0].chunks.push("wf-01");
    if(location === "modelPoints") topic.activity.paths[2].modelPoints![0].chunks.push("wf-01");
    if(location === "understandingCheck") topic.config.understandingCheck[0].chunk = "wf-01";
    if(location === "nextSteps") topic.config.nextSteps[0].chunks.push("wf-01");
    expect(checkContentIntegrity(input).some(problem => problem.includes("references unknown chunk: wf-01"))).toBe(true);
  });
  it.each(["Read wa-99.", "Read wf-01."])("catches unknown or cross-topic tokens in hint prose: %s", hint => {
    const input = fixture(); input.topics[0].config.stuckHints.lesson = hint;
    expect(checkContentIntegrity(input).some(problem => problem.includes("topic.stuckHints.lesson references unknown chunk"))).toBe(true);
  });
  it("catches a missing path hint", () => {
    const input = fixture(); delete input.topics[0].config.stuckHints["activity-observe"];
    expect(checkContentIntegrity(input)).toContain("Missing stuck hint: activity-observe");
  });
  it("catches missing fallback/default next steps", () => {
    const input = fixture(); input.topics[0].config.unsupportedFallback.nextStep = "missing"; input.topics[0].config.defaultNextStep.default = "missing-default";
    expect(checkContentIntegrity(input)).toContain("Unknown next step: missing"); expect(checkContentIntegrity(input)).toContain("Unknown next step: missing-default");
  });
  it("catches a live subject with no path", () => {
    const input = fixture(); delete input.catalog.areas[0].subjects[0].path;
    expect(checkContentIntegrity(input)).toContain("Live subject fish-farming has no path");
  });
  it("derives hint tokens from unfamiliar chunk prefixes", () => {
    const input = fixture();
    const topic = input.topics[0];
    const mapping = new Map(topic.lesson.chunks.map(chunk => [chunk.id, chunk.id.replace("wa-", "example.part-")]));
    topic.lesson.chunks.forEach(chunk => { chunk.id = mapping.get(chunk.id)!; });
    topic.config.understandingCheck.forEach(check => { check.chunk = mapping.get(check.chunk)!; });
    for (const item of [...topic.config.nextSteps, ...topic.activity.rubric, ...topic.activity.paths.flatMap(path => path.modelPoints ?? [])]) item.chunks = item.chunks.map(id => mapping.get(id)!);
    topic.config.stuckHints = Object.fromEntries(Object.entries(topic.config.stuckHints).map(([key,hint]) => [key, hint.replaceAll("wa-", "example.part-")]));
    expect(checkContentIntegrity(input)).toEqual([]);
    topic.config.stuckHints.lesson = "Read example.part-99.";
    expect(checkContentIntegrity(input)).toContain("topic.stuckHints.lesson references unknown chunk: example.part-99");
  });
});
