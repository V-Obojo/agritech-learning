import { describe, expect, it, vi } from "vitest";
vi.mock("server-only",()=>({}));
vi.mock("next/navigation",()=>({notFound:()=>{throw new Error("NOT_FOUND");}}));
import { getCatalog, getSubjectPath } from "@/lib/content";
import { generateStaticParams as areas } from "./[area]/page";
import { generateStaticParams as subjects } from "./[area]/[subject]/page";
import { generateStaticParams as topics } from "./[area]/[subject]/[topic]/page";
import { generateStaticParams as activities } from "./[area]/[subject]/[topic]/activity/page";
import { generateStaticParams as nextSteps } from "./[area]/[subject]/[topic]/next/page";
import { resolveArea, resolveSubject, resolveTopicRoute, resolveLearningRoute } from "./navigation-data";
describe("content-driven static routes",()=>{
  it("generates every catalog area and subject slug, including coming-soon pages",()=>{
    const catalog=getCatalog();
    expect(areas()).toEqual(catalog.areas.map(area=>({area:area.slug}))); expect(areas()).toHaveLength(3);
    expect(subjects()).toEqual(catalog.areas.flatMap(area=>area.subjects.map(subject=>({area:area.slug,subject:subject.slug})))); expect(subjects()).toHaveLength(14);
  });
  it("generates exactly the live topic params on lesson, activity and next pages",()=>{
    const expected=[{area:"animal-farming",subject:"fish-farming",topic:"what-is-fish-farming"},{area:"animal-farming",subject:"fish-farming",topic:"water"}];
    for(const generate of [topics,activities,nextSteps]) expect(generate()).toEqual(expected);
    for(const params of topics()) expect(getSubjectPath(params.subject).topics.find(topic=>topic.slug===params.topic)?.status).toBe("live");
  });
  it("resolves topic data, breadcrumbs and the next live topic from the path",()=>{
    const first=resolveLearningRoute("animal-farming","fish-farming","what-is-fish-farming");
    expect(first.context.basePath).toBe("/animal-farming/fish-farming/what-is-fish-farming");
    expect(first.context.nextTopic).toEqual({title:"Water: do I have enough?",basePath:"/animal-farming/fish-farming/water"});
    expect(resolveLearningRoute("animal-farming","fish-farming","water").context.nextTopic).toBeNull();
  });
  it("resolves coming-soon metadata without loading a lesson",()=>{
    expect(resolveTopicRoute("animal-farming","fish-farming","meet-the-catfish").meta.status).toBe("coming-soon");
    expect(resolveSubject("animal-farming","poultry").subject.status).toBe("coming-soon");
    expect(()=>resolveLearningRoute("animal-farming","fish-farming","meet-the-catfish")).toThrow("NOT_FOUND");
  });
  it("rejects unknown and mismatched slugs",()=>{
    expect(()=>resolveArea("unknown")).toThrow("NOT_FOUND");
    expect(()=>resolveSubject("crop-farming","fish-farming")).toThrow("NOT_FOUND");
    expect(()=>resolveTopicRoute("animal-farming","fish-farming","unknown")).toThrow("NOT_FOUND");
  });
});
