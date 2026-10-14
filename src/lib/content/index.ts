import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { parseLesson } from "./parse-lesson";
import {
  activitySchema, pathwaySchema, sourcesSchema,
  type Activity, type Lesson, type Pathway, type Sources,
} from "./schemas";

function readContent(filename: string): string {
  try {
    return readFileSync(path.join(process.cwd(), "content", filename), "utf8");
  } catch (error) {
    throw new Error(`Cannot read content/${filename}`, { cause: error });
  }
}

function readJson<T>(filename: string, schema: z.ZodType<T>): T {
  let value: unknown;
  try {
    value = JSON.parse(readContent(filename));
  } catch (error) {
    throw new Error(`Cannot load content/${filename}: ${String(error)}`, { cause: error });
  }
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(`Invalid content/${filename}: ${result.error.message}`);
  return result.data;
}

let sources: Sources | undefined;
let lesson: Lesson | undefined;
let activity: Activity | undefined;
let pathway: Pathway | undefined;

export function getSources(): Sources {
  return sources ??= readJson("sources.json", sourcesSchema);
}
export function getLesson(): Lesson {
  if (!lesson) {
    try {
      lesson = parseLesson(readContent("lessons/water-availability.md"));
    } catch (error) {
      throw new Error(`Cannot load content/lessons/water-availability.md: ${String(error)}`, { cause: error });
    }
  }
  return lesson;
}
export function getActivity(): Activity {
  return activity ??= readJson("activity.json", activitySchema);
}
export function getPathway(): Pathway {
  return pathway ??= readJson("pathway.json", pathwaySchema);
}
export function getChunk(id: string) {
  const chunk = getLesson().chunks.find((chunk) => chunk.id === id);
  if (!chunk) throw new Error(`Unknown lesson chunk: ${id}`);
  return chunk;
}
export function getChunks(ids: string[]) {
  return ids.map(getChunk);
}
