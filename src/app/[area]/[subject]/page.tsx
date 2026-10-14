import { Suspense } from "react";
import { NavigationEvent } from "@/components/navigation-event";
import { getCatalog, getSubjectPath } from "@/lib/content";
import { Breadcrumb } from "@/components/breadcrumb";
import { ComingSoon } from "@/components/coming-soon";
import { SubjectHub } from "@/components/subject-hub";
import { areaPath, firstLiveHub, generateSubjectParams, resolveSubject, subjectCrumbs, topicPath } from "../../navigation-data";
export const generateStaticParams = generateSubjectParams;
export default function SubjectPage(props: {params:Promise<{area:string;subject:string}>}) {
  return <Suspense fallback={<main id="main" aria-busy="true"><p>Loading your learning path...</p></main>}><RouteContent {...props} /></Suspense>;
}
async function RouteContent({params}: {params:Promise<{area:string;subject:string}>}) {
  const {area,subject}=await params; const route=resolveSubject(area,subject);
  if(route.subject.status!=="live" || route.area.status!=="live") return <main id="main"><NavigationEvent name="subject_opened" areaId={route.area.id} subjectId={route.subject.id} /><Breadcrumb items={subjectCrumbs(route)} /><ComingSoon title={route.subject.label} blurb={route.subject.blurb} back={{href:areaPath(route.area.slug),label:route.area.label}} liveHub={firstLiveHub()} /></main>;
  const path=getSubjectPath(route.subject.id);
  return <main id="main"><NavigationEvent name="subject_opened" areaId={route.area.id} subjectId={route.subject.id} /><Breadcrumb items={subjectCrumbs(route)} /><h1>{path.title}</h1><p>{path.intro}</p>
    <SubjectHub path={path} intentions={getCatalog().intentions} links={path.topics.filter(topic=>topic.status==="live").map(topic=>({id:topic.id,href:topicPath(route.area.slug,route.subject.slug,topic.slug)}))} />
  </main>;
}
