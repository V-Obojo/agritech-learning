import { NavigationEvent } from "@/components/navigation-event";
import { getCatalog, getSubjectPath } from "@/lib/content";
import { Breadcrumb } from "@/components/breadcrumb";
import { ComingSoon } from "@/components/coming-soon";
import { SubjectHub } from "@/components/subject-hub";
import { areaPath, firstLiveHub, generateSubjectParams, resolveSubject, subjectCrumbs, topicPath } from "../../navigation-data";
export const generateStaticParams = generateSubjectParams;
export default async function SubjectPage({params}: {params:Promise<{area:string;subject:string}>}) {
  const {area,subject}=await params; const route=resolveSubject(area,subject);
  if(route.subject.status!=="live" || route.area.status!=="live") return <main id="main"><NavigationEvent name="subject_opened" areaId={route.area.id} subjectId={route.subject.id} /><Breadcrumb items={subjectCrumbs(route)} /><ComingSoon title={route.subject.label} blurb={route.subject.blurb} back={{href:areaPath(route.area.slug),label:route.area.label}} liveHub={firstLiveHub()} /></main>;
  const path=getSubjectPath(route.subject.id);
  return <main id="main"><NavigationEvent name="subject_opened" areaId={route.area.id} subjectId={route.subject.id} /><Breadcrumb items={subjectCrumbs(route)} /><h1>{path.title}</h1><p>{path.intro}</p>
    <section className="card"><h2>What you’ll learn</h2><ul>{path.whatYouWillLearn.map(item=><li key={item}>{item}</li>)}</ul></section>
    <SubjectHub path={path} intentions={getCatalog().intentions} links={path.topics.filter(topic=>topic.status==="live").map(topic=>({id:topic.id,href:topicPath(route.area.slug,route.subject.slug,topic.slug)}))} />
  </main>;
}
