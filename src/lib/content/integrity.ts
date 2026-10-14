import { getCatalog, getSources, getSubjectPath, getTopic } from "./index";
import type { Catalog, Sources, Topic } from "./schemas";
import {checkMediaIntegrity} from "./media-integrity";
export interface ContentIntegrityInput { catalog: Catalog; sources: Sources; topics: Topic[] }
export function checkContentIntegrity(input?: ContentIntegrityInput): string[] {
  const problems: string[] = [];
  const catalog = input?.catalog ?? getCatalog();
  const sources = input?.sources ?? getSources();
  for (const area of catalog.areas) for (const subject of area.subjects) if (subject.status === "live" && !subject.path) problems.push(`Live subject ${subject.id} has no path`);
  const topics = input?.topics ?? catalog.areas.filter(area => area.status === "live").flatMap(area => area.subjects.filter(subject => subject.status === "live" && subject.path).flatMap(subject => {
    try {
      return getSubjectPath(subject.id).topics.filter(meta => meta.status === "live").flatMap(meta => {
        try { return [getTopic(subject.id, meta.id)]; }
        catch (error) { problems.push(String(error)); return []; }
      });
    } catch (error) { problems.push(String(error)); return []; }
  }));
  const sourceIds = new Set(sources.sources.map(source => source.id));
  const allIds = new Set<string>();
  const prefixes = [...new Set(topics.flatMap(topic => topic.lesson.chunks.map(chunk => chunk.id.replace(/\d+$/, ""))))];
  const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const tokenPattern = prefixes.length ? new RegExp(`\\b(?:${prefixes.map(escape).join("|")})\\d+\\b`, "g") : null;
  for (const {lesson, config, activity} of topics) {
    const ids = new Set(lesson.chunks.map(chunk => chunk.id));
    for (const chunk of lesson.chunks) {
      if (allIds.has(chunk.id)) problems.push(`Duplicate chunk id: ${chunk.id}`);
      allIds.add(chunk.id);
      if (!chunk.sourceIds.length) problems.push(`Chunk ${chunk.id} has no sources`);
      for (const id of chunk.sourceIds) if (!sourceIds.has(id)) problems.push(`Chunk ${chunk.id} references unknown source id: ${id}`);
    }
    function references(value: unknown, location: string) {
      if (Array.isArray(value)) value.forEach((child, i) => references(child, `${location}[${i}]`));
      else if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) {
        if (key === "chunk" || key === "chunks") for (const id of Array.isArray(child) ? child : [child]) {
          if (!ids.has(id)) problems.push(`${location}.${key} references unknown chunk: ${id}`);
        } else references(child, `${location}.${key}`);
      }
    }
    references(config, "topic"); references(activity, "activity");
    for (const [key, hint] of Object.entries(config.stuckHints)) for (const id of tokenPattern ? hint.match(tokenPattern) ?? [] : []) if (!ids.has(id)) problems.push(`topic.stuckHints.${key} references unknown chunk: ${id}`);
    for (const id of [config.unsupportedFallback.nextStep, ...Object.values(config.defaultNextStep)]) if (!config.nextSteps.some(step => step.id === id)) problems.push(`Unknown next step: ${id}`);
    if (!config.defaultNextStep.default) problems.push(`Missing default next step: ${lesson.id}`);
    for (const path of activity.paths) if (!config.stuckHints[`activity-${path.id}`]) problems.push(`Missing stuck hint: activity-${path.id}`);
    for (const path of activity.paths) for (const point of path.modelPoints ?? []) if (!activity.rubric.some(criterion => criterion.id === point.criterion)) problems.push(`Unknown model-point criterion: ${point.criterion}`);
  }
  if(!input) {try{problems.push(...checkMediaIntegrity());}catch(error){problems.push(String(error));}}
  return problems;
}
