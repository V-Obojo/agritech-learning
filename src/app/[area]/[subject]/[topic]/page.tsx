import { Suspense } from "react";
import { NavigationEvent } from "@/components/navigation-event";
import { getSources } from "@/lib/content";
import { Breadcrumb } from "@/components/breadcrumb";
import { ComingSoon } from "@/components/coming-soon";
import { LessonFlow } from "@/components/lesson-flow";
import { generateTopicParams, resolveLearningRoute, resolveTopicRoute, topicCrumbs } from "../../../navigation-data";
export const generateStaticParams = generateTopicParams;
function Body({body}: {body:string}) {
  return body.split("\n").filter(line=>!/^\s*::(?:figure|lab)\b/.test(line)).join("\n").split(/\n\n+/).map((block,index)=>{
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
  return <main id="main"><NavigationEvent name="topic_opened" areaId={route.area.id} subjectId={route.subject.id} topicId={route.meta.id} /><Breadcrumb items={topicCrumbs(route)} /><p className="eyebrow">Topic {route.meta.order} of {route.path.topics.length} · About {data.lesson.estimated_minutes} minutes</p>
    <h1>{data.lesson.title}</h1><LessonFlow topic={context} chunks={data.lesson.chunks.map(({id,title})=>({id,title}))}>
      {data.lesson.chunks.map(chunk=><section className="lesson-chunk" id={chunk.id} key={chunk.id} aria-labelledby={`${chunk.id}-title`}>
        <p className="eyebrow">{chunk.id}</p><h2 id={`${chunk.id}-title`}>{chunk.title}</h2><Body body={chunk.body} />
        <details><summary>Sources</summary><ul>{chunk.sourceIds.map(id=>{const source=sources.find(source=>source.id===id)!;
          return <li key={id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><p>{source.publisher} · {source.year}</p></li>;
        })}</ul></details>
      </section>)}
    </LessonFlow>
  </main>;
}
