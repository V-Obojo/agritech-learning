import { getActivity, getLesson, getPathway, getSources } from "./index";
import type { Activity, Lesson, Pathway, Sources } from "./schemas";

export interface ContentIntegrityInput {
  sources: Sources;
  lesson: Lesson;
  activity: Activity;
  pathway: Pathway;
}

export function checkContentIntegrity(input?: ContentIntegrityInput): string[] {
  const { sources, lesson, activity, pathway } = input ?? {
    sources: getSources(), lesson: getLesson(), activity: getActivity(), pathway: getPathway(),
  };
  const problems: string[] = [];
  const sourceIds = new Set(sources.sources.map((source) => source.id));
  const chunkIds = new Set<string>();
  for (const chunk of lesson.chunks) {
    if (chunkIds.has(chunk.id)) problems.push(`Duplicate chunk id: ${chunk.id}`);
    chunkIds.add(chunk.id);
    if (!chunk.sourceIds.length) problems.push(`Chunk ${chunk.id} has no sources`);
    for (const sourceId of chunk.sourceIds) {
      if (!sourceIds.has(sourceId)) problems.push(`Chunk ${chunk.id} references unknown source id: ${sourceId}`);
    }
  }
  function checkReferences(value: unknown, location: string) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => checkReferences(item, `${location}[${index}]`));
    } else if (value && typeof value === "object") {
      for (const [key, child] of Object.entries(value)) {
        if (key === "chunk" || key === "chunks") {
          const ids: unknown[] = Array.isArray(child) ? child : [child];
          for (const id of ids) {
            if (typeof id !== "string" || !chunkIds.has(id)) {
              problems.push(`${location}.${key} references unknown chunk: ${String(id)}`);
            }
          }
        } else checkReferences(child, `${location}.${key}`);
      }
    }
  }
  checkReferences(activity, "activity");
  checkReferences(pathway, "pathway");
  // Authored hints also cite wa-NN ids inside their prose.
  for (const [hintId, hint] of Object.entries(pathway.stuckHints)) {
    for (const id of hint.match(/\bwa-\d+\b/g) ?? []) {
      if (!chunkIds.has(id)) problems.push(`pathway.stuckHints.${hintId} references unknown chunk: ${id}`);
    }
  }
  if (!pathway.nextSteps.some((step) => step.id === pathway.unsupportedFallback.nextStep)) {
    problems.push(`unsupportedFallback.nextStep references unknown next step: ${pathway.unsupportedFallback.nextStep}`);
  }
  return problems;
}
