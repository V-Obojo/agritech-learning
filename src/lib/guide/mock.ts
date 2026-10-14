import "server-only";
import { getLesson, getPathway } from "../content";
import type { GuideRequest, ModelGuideOutput } from "./types";

const stopWords = new Set(
  "a an the and or but to of for in on at is are was were be been it its this that does do did why how what which who i me my you your should can could would will there about with from have has not".split(" "),
);
const outOfScope = /\b(doses?|dosages?|medicines?|drugs?|treat(?:s|ed|ing|ment)?|disease\s+cure|prices?|loans?|credit|feed\s+formula|stocking\s+density)\b/i;
const minimumScore = 2;

function keywords(text: string): Set<string> {
  // wa-03 calls this "dry periods"; normalize the learner's equivalent phrase.
  const normalized = text.toLowerCase().replace(/\bdry[\s-]+season\b/g, "dry periods");
  return new Set((normalized.match(/[a-z0-9]+/g) ?? []).filter((word) => !stopWords.has(word)));
}

export function mockGuide(request: GuideRequest): ModelGuideOutput {
  const pathway = getPathway();
  const unsupported: ModelGuideOutput = {
    answer: pathway.unsupportedFallback.message, supported: false, citedChunkIds: [],
    nextStepId: pathway.unsupportedFallback.nextStep,
  };
  if (outOfScope.test(request.question)) return unsupported;
  const questionWords = keywords(request.question);
  const ranked = getLesson().chunks.map((chunk) => {
    const chunkWords = keywords(`${chunk.title} ${chunk.body}`);
    const score = [...questionWords].filter((word) => chunkWords.has(word)).length;
    return { chunk, score };
  }).sort((a, b) => b.score - a.score || a.chunk.id.localeCompare(b.chunk.id));
  if (!ranked.length || ranked[0].score < minimumScore) return unsupported;
  const selected = ranked.filter(({ score }) => score >= minimumScore).slice(0, 2);
  const citedChunkIds = selected.map(({ chunk }) => chunk.id);
  const nextStep = pathway.nextSteps.find((step) => step.chunks.some((id) => citedChunkIds.includes(id)));
  return {
    answer: selected.map(({ chunk }) => `${chunk.body.split(/(?<=[.!?])\s+/)[0]} [${chunk.id}]`).join("\n\n"),
    supported: true,
    citedChunkIds,
    nextStepId: nextStep?.id ?? pathway.unsupportedFallback.nextStep,
  };
}
