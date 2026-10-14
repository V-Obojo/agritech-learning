import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getActivity, getLesson, getPathway, getSources } from "./index";
import { checkContentIntegrity, type ContentIntegrityInput } from "./integrity";

function fixture(): ContentIntegrityInput {
  return structuredClone({
    sources: getSources(), lesson: getLesson(), activity: getActivity(), pathway: getPathway(),
  });
}

describe("checkContentIntegrity", () => {
  it("returns no problems for current content", () => {
    expect(checkContentIntegrity()).toEqual([]);
  });
  it("catches an unknown source id in memory", () => {
    const input = fixture();
    input.lesson.chunks[0].sourceIds.push("missing-source");
    expect(checkContentIntegrity(input)).toEqual([
      "Chunk wa-01 references unknown source id: missing-source",
    ]);
  });
  it("catches chunks without sources and duplicate ids", () => {
    const input = fixture();
    input.lesson.chunks[0].sourceIds = [];
    input.lesson.chunks.push(structuredClone(input.lesson.chunks[1]));
    expect(checkContentIntegrity(input)).toEqual([
      "Chunk wa-01 has no sources", "Duplicate chunk id: wa-02",
    ]);
  });
  it.each(["rubric", "modelPoints", "understandingCheck", "nextSteps"] as const)(
    "catches an unknown chunk reference in %s", (location) => {
      const input = fixture();
      if (location === "rubric") input.activity.rubric[0].chunks.push("missing-chunk");
      if (location === "modelPoints") input.activity.paths[2].modelPoints![0].chunks.push("missing-chunk");
      if (location === "understandingCheck") input.pathway.understandingCheck[0].chunk = "missing-chunk";
      if (location === "nextSteps") input.pathway.nextSteps[0].chunks.push("missing-chunk");
      const problems = checkContentIntegrity(input);
      expect(problems).toHaveLength(1);
      expect(problems[0]).toContain("references unknown chunk: missing-chunk");
    },
  );
  it("catches a fallback pointing to a missing next step", () => {
    const input = fixture();
    input.pathway.unsupportedFallback.nextStep = "missing-step";
    expect(checkContentIntegrity(input)).toEqual([
      "unsupportedFallback.nextStep references unknown next step: missing-step",
    ]);
  });
  it("catches an unknown chunk cited in an authored hint", () => {
    const input = fixture();
    input.pathway.stuckHints.lesson = "Read wa-99.";
    expect(checkContentIntegrity(input)).toEqual([
      "pathway.stuckHints.lesson references unknown chunk: wa-99",
    ]);
  });
});
