import "server-only";
import { notFound } from "next/navigation";
import { getArea, getCatalog, getSubject, getSubjectPath, getTopic } from "@/lib/content";
import type { LearningContext } from "@/components/learning-types";
export const homePath = "/";
export function areaPath(slug: string) { return `/${encodeURIComponent(slug)}`; }
export function subjectPath(area: string, subject: string) { return `${areaPath(area)}/${encodeURIComponent(subject)}`; }
export function topicPath(area: string, subject: string, topic: string) { return `${subjectPath(area,subject)}/${encodeURIComponent(topic)}`; }
export function generateAreaParams() { return getCatalog().areas.map(area => ({area:area.slug})); }
export function generateSubjectParams() { return getCatalog().areas.flatMap(area => area.subjects.map(subject => ({area:area.slug,subject:subject.slug}))); }
export function generateTopicParams() {
  return getCatalog().areas.filter(area => area.status==="live").flatMap(area => area.subjects.filter(subject => subject.status==="live").flatMap(subject => getSubjectPath(subject.id).topics.filter(topic => topic.status==="live").map(topic => ({area:area.slug,subject:subject.slug,topic:topic.slug}))));
}
export function resolveArea(slug: string) { const area=getArea(slug); if(!area) notFound(); return area; }
export function resolveSubject(areaSlug: string, subjectSlug: string) {
  const area=resolveArea(areaSlug); const subject=getSubject(areaSlug,subjectSlug); if(!subject) notFound();
  return {area,subject,hubPath:subjectPath(area.slug,subject.slug)};
}
export function resolveTopicRoute(areaSlug: string, subjectSlug: string, topicSlug: string) {
  const route=resolveSubject(areaSlug,subjectSlug);
  if(route.area.status!=="live" || route.subject.status!=="live") notFound();
  const path=getSubjectPath(route.subject.id);
  const meta=path.topics.find(topic => topic.slug===topicSlug); if(!meta) notFound();
  return {...route,path,meta,basePath:topicPath(route.area.slug,route.subject.slug,meta.slug)};
}
export function resolveLearningRoute(areaSlug: string, subjectSlug: string, topicSlug: string) {
  const route=resolveTopicRoute(areaSlug,subjectSlug,topicSlug); if(route.meta.status!=="live") notFound();
  const topic=getTopic(route.subject.id,route.meta.id);
  const next=route.path.topics.filter(meta => meta.status==="live" && meta.order>route.meta.order).sort((a,b)=>a.order-b.order)[0];
  const context: LearningContext={subjectId:route.subject.id,topicId:route.meta.id,basePath:route.basePath,hubPath:route.hubPath,hubTitle:route.path.title,homePath,
    config:topic.config,intentions:getCatalog().intentions,nextTopic:next ? {title:next.title,basePath:topicPath(route.area.slug,route.subject.slug,next.slug)} : null};
  return {...route,topic,context};
}
export function firstLiveHub() {
  for(const area of getCatalog().areas) if(area.status==="live") for(const subject of area.subjects) if(subject.status==="live") return {href:subjectPath(area.slug,subject.slug),label:subject.label};
  return null;
}
export function subjectCrumbs(route: ReturnType<typeof resolveSubject>) {
  return [{label:"Home",href:homePath},{label:route.area.label,href:areaPath(route.area.slug)},{label:route.subject.label,href:route.hubPath}];
}
export function topicCrumbs(route: ReturnType<typeof resolveTopicRoute>) { return [...subjectCrumbs(route),{label:route.meta.title,href:route.basePath}]; }
