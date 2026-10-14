import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { mediaRegistrySchema,labsRegistrySchema } from "./media-labs";
import { badgesSchema } from "../insights/calculators";
import { parseLesson } from "./parse-lesson";
import { activitySchema, catalogSchema, subjectPathSchema, topicConfigSchema, sourcesSchema, type Catalog, type Sources, type SubjectPath, type Topic } from "./schemas";

function readContent(filename: string): string {
  try { return readFileSync(path.join(process.cwd(), "content", filename), "utf8"); }
  catch (error) { throw new Error(`Cannot read content/${filename}`, { cause: error }); }
}
function readJson<T>(filename: string, schema: z.ZodType<T>): T {
  let value: unknown;
  try { value = JSON.parse(readContent(filename)); }
  catch (error) { throw new Error(`Cannot load content/${filename}: ${String(error)}`, { cause: error }); }
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(`Invalid content/${filename}: ${result.error.message}`);
  return result.data;
}
let sources: Sources | undefined;
let catalog: Catalog | undefined;
const paths = new Map<string, SubjectPath>();
const topics = new Map<string, Topic>();
export class InvalidTopicError extends Error {}
export function getSources() { return sources ??= readJson("sources.json", sourcesSchema); }
export function listMedia() {return readJson("media.json",mediaRegistrySchema).media;}
export function getMedia(id:string) {const item=listMedia().find(item=>item.id===id);if(!item) throw new Error(`Unknown media: ${id}`);return item;}
export function listLabs() {return readJson("labs.json",labsRegistrySchema).labs;}
export function getLab(id:string) {const item=listLabs().find(item=>item.id===id);if(!item) throw new Error(`Unknown lab: ${id}`);return item;}
export function getBadges() {return readJson("badges.json",badgesSchema).badges;}
export function getCatalog() { return catalog ??= readJson("catalog.json", catalogSchema); }
export function getArea(areaSlug: string) { return getCatalog().areas.find(area => area.slug === areaSlug) ?? null; }
export function getSubject(areaSlug: string, subjectSlug: string) { return getArea(areaSlug)?.subjects.find(subject => subject.slug === subjectSlug) ?? null; }
function findSubject(subjectId: string) {
  return getCatalog().areas.filter(area => area.status === "live").flatMap(area => area.subjects).find(subject => subject.id === subjectId && subject.status === "live");
}
export function getSubjectPath(subjectId: string): SubjectPath {
  const subject = findSubject(subjectId);
  if (!subject?.path) throw new InvalidTopicError("Unknown or unavailable subject");
  if (!paths.has(subjectId)) paths.set(subjectId, readJson(path.join(subject.path, "path.json"), subjectPathSchema));
  return paths.get(subjectId)!;
}
export function getTopic(subjectId: string, topicSlug: string): Topic {
  const subject = findSubject(subjectId);
  const meta = getSubjectPath(subjectId).topics.find(topic => topic.slug === topicSlug || topic.id === topicSlug);
  if (!subject?.path || meta?.status !== "live") throw new InvalidTopicError("Unknown or unavailable topic");
  const key = JSON.stringify([subjectId, meta.id]);
  if (!topics.has(key)) {
    const directory = path.join(subject.path, meta.id);
    topics.set(key, { meta, lesson: parseLesson(readContent(path.join(directory, "lesson.md"))), config: readJson(path.join(directory, "topic.json"), topicConfigSchema), activity: readJson(path.join(directory, "activity.json"), activitySchema) });
  }
  return topics.get(key)!;
}
export function listLiveTopics() {
  return getCatalog().areas.filter(area => area.status === "live").flatMap(area => area.subjects.filter(subject => subject.status === "live").flatMap(subject => getSubjectPath(subject.id).topics.filter(topic => topic.status === "live").sort((a,b) => a.order-b.order).map(topic => ({ subjectId: subject.id, topicId: topic.id }))));
}
export function resolveTopic(request: { subjectId?: string; topicId: string }) {
  const matches = listLiveTopics().filter(topic => topic.topicId === request.topicId && (!request.subjectId || topic.subjectId === request.subjectId));
  if (matches.length !== 1) throw new InvalidTopicError("Unknown or unavailable topic");
  return getTopic(matches[0].subjectId, matches[0].topicId);
}
export function getChunk(subjectId: string, topicId: string, chunkId: string) {
  const chunk = getTopic(subjectId, topicId).lesson.chunks.find(chunk => chunk.id === chunkId);
  if (!chunk) throw new Error(`Unknown lesson chunk: ${chunkId}`);
  return chunk;
}
export function getChunks(subjectId: string, topicId: string, ids: string[]) { return ids.map(id => getChunk(subjectId, topicId, id)); }
