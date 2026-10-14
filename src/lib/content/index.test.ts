import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { getArea, getCatalog, getSubject, getSubjectPath, getTopic, getChunk, getChunks, getSources, listLiveTopics } from "./index";
describe("content loaders", () => {
  it("loads three areas with the authored subject availability", () => {
    const catalog = getCatalog();
    expect(catalog.areas).toHaveLength(3);
    expect(getArea("animal-farming")?.subjects.filter(subject => subject.status === "coming-soon")).toHaveLength(4);
    expect(getSubject("animal-farming", "fish-farming")?.status).toBe("live");
    for (const slug of ["crop-farming", "agro-processing"]) {
      expect(getArea(slug)?.status).toBe("coming-soon");
      expect(getArea(slug)?.subjects.every(subject => subject.status === "coming-soon")).toBe(true);
    }
    expect(getArea("missing")).toBeNull(); expect(getSubject("missing", "missing")).toBeNull();
  });
  it("loads the five-topic fish path in order, with two live topics", () => {
    const path = getSubjectPath("fish-farming");
    expect(path.topics.map(topic => topic.order)).toEqual([1,2,3,4,5]);
    expect(path.topics.filter(topic => topic.status === "live").map(topic => topic.id)).toEqual(["what-is-fish-farming", "water"]);
    expect(listLiveTopics()).toEqual([{subjectId: "fish-farming", topicId: "what-is-fish-farming"}, {subjectId: "fish-farming", topicId: "water"}]);
  });
  it.each([["what-is-fish-farming", 8, "wf"], ["water", 10, "wa"]] as const)("loads %s chunks and config/activity", (id, count, prefix) => {
    const topic = getTopic("fish-farming", id);
    expect(topic.lesson.chunks.map(chunk => chunk.id)).toEqual(Array.from({length: count}, (_,i) => `${prefix}-${String(i+1).padStart(2,"0")}`));
    for (const chunk of topic.lesson.chunks) { expect(chunk.sourceIds.length).toBeGreaterThan(0); expect(chunk.body.length).toBeGreaterThan(0); }
    expect(topic.activity.lesson).toBe(id); expect(topic.config.understandingCheck).toHaveLength(3);
  });
  it("does not load unknown or coming-soon topics/subjects", () => {
    for (const id of ["unknown", "meet-the-catfish"]) expect(() => getTopic("fish-farming", id)).toThrow("Unknown or unavailable topic");
    expect(() => getSubjectPath("poultry")).toThrow();
  });
  it("caches by subject/topic and caches shared documents", () => {
    expect(getCatalog()).toBe(getCatalog()); expect(getSources()).toBe(getSources()); expect(getSources().sources).toHaveLength(8);
    expect(getSubjectPath("fish-farming")).toBe(getSubjectPath("fish-farming"));
    for (const key of listLiveTopics()) expect(getTopic(key.subjectId,key.topicId)).toBe(getTopic(key.subjectId,key.topicId));
    expect(getTopic("fish-farming","water")).not.toBe(getTopic("fish-farming","what-is-fish-farming"));
  });
  it("looks up ordered chunks within the selected topic", () => {
    expect(getChunk("fish-farming", "water", "wa-01")).toBe(getTopic("fish-farming","water").lesson.chunks[0]);
    expect(getChunks("fish-farming", "water", ["wa-10", "wa-01", "wa-10"]).map(chunk => chunk.id)).toEqual(["wa-10", "wa-01", "wa-10"]);
    expect(getChunks("fish-farming", "water", [])).toEqual([]);
    expect(() => getChunk("fish-farming", "water", "wf-01")).toThrow("Unknown lesson chunk");
  });
});
