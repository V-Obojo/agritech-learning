import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { getCatalog,getSubjectPath,getTopic } from "../content";
import { badgesSchema,type InsightTopic } from "./calculators";
const labsSchema=z.object({labs:z.array(z.object({id:z.string(),title:z.string(),subjectId:z.string(),topicId:z.string()}))});
export function getInsightContent() {
  const badges=badgesSchema.parse(JSON.parse(readFileSync(join(process.cwd(),"content/badges.json"),"utf8")));
  const labs=labsSchema.parse(JSON.parse(readFileSync(join(process.cwd(),"content/labs.json"),"utf8"))).labs;
  const catalog=getCatalog();
  const topics:InsightTopic[]=catalog.areas.filter(a=>a.status==="live").flatMap(area=>area.subjects.filter(s=>s.status==="live").flatMap(subject=>getSubjectPath(subject.id).topics.filter(t=>t.status==="live").sort((a,b)=>a.order-b.order).map(meta=>{
    const topic=getTopic(subject.id,meta.id),hubUrl=`/${area.slug}/${subject.slug}`;
    return {subjectId:subject.id,topicId:meta.id,title:meta.title,subjectTitle:subject.label,url:`${hubUrl}/${meta.slug}`,hubUrl,estimated_minutes:topic.lesson.estimated_minutes,checks:topic.config.understandingCheck.map(({id,answerIndex})=>({id,answerIndex})),pathIds:topic.activity.paths.map(p=>p.id),labIds:labs.filter(l=>l.subjectId===subject.id&&l.topicId===meta.id).map(l=>l.id)};
  })));
  return {badges,topics,labs,intentions:catalog.intentions};
}
