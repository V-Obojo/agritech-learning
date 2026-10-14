import { Suspense } from "react";
import { Breadcrumb } from "@/components/breadcrumb";
import { NextFlow } from "@/components/next-flow";
import { generateTopicParams, resolveLearningRoute, topicCrumbs } from "../../../../navigation-data";
export const generateStaticParams = generateTopicParams;
export default function NextPage(props: {params:Promise<{area:string;subject:string;topic:string}>}) {
  return <Suspense fallback={<main id="main" aria-busy="true"><p>Loading your learning path...</p></main>}><RouteContent {...props} /></Suspense>;
}
async function RouteContent({params}: {params:Promise<{area:string;subject:string;topic:string}>}) {
  const {area,subject,topic}=await params; const route=resolveLearningRoute(area,subject,topic);
  return <main id="main"><Breadcrumb items={[...topicCrumbs(route),{label:"Next steps",href:`${route.basePath}/next`}]} /><p className="eyebrow">Topic {route.meta.order} of {route.path.topics.length}</p><h1>Choose what comes next</h1>
    <NextFlow topic={route.context} />
  </main>;
}
