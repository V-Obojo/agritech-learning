import { Suspense } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { ActivityFlow } from "@/components/activity-flow";
import { generateTopicParams, resolveLearningRoute, topicCrumbs } from "../../../../navigation-data";
export const generateStaticParams = generateTopicParams;
export default function ActivityPage(props: {params:Promise<{area:string;subject:string;topic:string}>}) {
  return <Suspense fallback={<main id="main" aria-busy="true"><p>Loading your learning path...</p></main>}><RouteContent {...props} /></Suspense>;
}
async function RouteContent({params}: {params:Promise<{area:string;subject:string;topic:string}>}) {
  const {area,subject,topic}=await params; const route=resolveLearningRoute(area,subject,topic);
  return <main id="main"><Breadcrumb items={[...topicCrumbs(route),{label:"Activity",href:`${route.basePath}/activity`}]} /><p className="eyebrow">Topic {route.meta.order} of {route.path.topics.length} · Try a small activity</p><h1>{route.topic.activity.title}</h1>
    <ActivityFlow activity={route.topic.activity} topic={route.context} />
  </main>;
}
