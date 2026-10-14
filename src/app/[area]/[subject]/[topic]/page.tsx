import { Suspense } from "react";
import Link from "next/link";
import { NavigationEvent } from "@/components/navigation-event";
import { getSources,getMedia,getLab,getBadges } from "@/lib/content";
import {parseBlocks} from "@/lib/content/parse-lesson";
import {labFallback} from "@/lib/content/lab-links";
import {Figure} from "@/components/media/figure";
import {LabFrame} from "@/components/labs/lab-frame";
import { Breadcrumb } from "@/components/breadcrumb";
import { ComingSoon } from "@/components/coming-soon";
import { LessonFlow } from "@/components/lesson-flow";
import { generateTopicParams, resolveLearningRoute, resolveTopicRoute, topicCrumbs,topicPath } from "../../../navigation-data";
export const generateStaticParams = generateTopicParams;
function Body({body}: {body:string}) {
  return body.split(/\n\n+/).map((block,index)=>{
    const lines=block.split("\n"); const bulletStart=lines.findIndex(line=>line.startsWith("- "));
    return <div key={index}>{bulletStart<0 ? <p>{block}</p> : <>{bulletStart>0 && <p>{lines.slice(0,bulletStart).join(" ")}</p>}<ul>{lines.slice(bulletStart).map((line,item)=><li key={item}>{line.replace(/^- /,"")}</li>)}</ul></>}</div>;
  });
}
export default function TopicPage(props: {params:Promise<{area:string;subject:string;topic:string}>}) {
  return <Suspense fallback={<main id="main" aria-busy="true"><p>Loading your learning path...</p></main>}><RouteContent {...props} /></Suspense>;
}
async function RouteContent({params}: {params:Promise<{area:string;subject:string;topic:string}>}) {
  const {area,subject,topic}=await params; const route=resolveTopicRoute(area,subject,topic);
  if(route.meta.status!=="live") return <main id="main"><NavigationEvent name="topic_opened" areaId={route.area.id} subjectId={route.subject.id} topicId={route.meta.id} /><Breadcrumb items={topicCrumbs(route)} /><ComingSoon title={route.meta.title} blurb={route.meta.summary} back={{href:route.hubPath,label:route.subject.label}} /></main>;
  const {topic:data,context}=resolveLearningRoute(area,subject,topic); const sources=getSources().sources;
  const previous=route.path.topics.filter(t=>t.status==="live"&&t.order<route.meta.order).sort((a,b)=>b.order-a.order)[0];
  return <main id="main"><NavigationEvent name="topic_opened" areaId={route.area.id} subjectId={route.subject.id} topicId={route.meta.id} /><Breadcrumb items={topicCrumbs(route)} /><p className="eyebrow">Topic {route.meta.order} of {route.path.topics.length} · About {data.lesson.estimated_minutes} minutes</p>
    <h1>{data.lesson.title}</h1><LessonFlow topic={context} chunks={data.lesson.chunks.map(({id,title})=>({id,title}))}>
      {data.lesson.chunks.map(chunk=><section className="lesson-chunk" id={chunk.id} key={chunk.id} aria-labelledby={`${chunk.id}-title`}>
        <p className="eyebrow">{chunk.id}</p><h2 id={`${chunk.id}-title`}>{chunk.title}</h2>{(chunk.blocks??parseBlocks(chunk.body)).map((block,index)=>{
          if(block.type==="text") return <Body key={index} body={block.text}/>;
          if(block.type==="figure") return <Figure key={index} media={getMedia(block.mediaId)}/>;
          const lab=getLab(block.labId);return <LabFrame key={index} lab={lab} fallback={labFallback(lab)} badge={getBadges().find(b=>b.id===lab.badge)}/>;
        })}
        <details><summary>Sources</summary><ul>{chunk.sourceIds.map(id=>{const source=sources.find(source=>source.id===id)!;
          return <li key={id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><p>{source.publisher} · {source.year}</p></li>;
        })}</ul></details>
      </section>)}
      <nav className="actions" aria-label="Topic navigation">{previous&&<Link className="button secondary" prefetch={false} href={topicPath(area,subject,previous.slug)}>Previous topic: {previous.title}</Link>}{context.nextTopic&&<Link className="button secondary" prefetch={false} href={context.nextTopic.basePath}>Next topic: {context.nextTopic.title}</Link>}</nav>
    </LessonFlow>
  </main>;
}
