import { Breadcrumb } from "@/components/breadcrumb";
import { NextFlow } from "@/components/next-flow";
import { DraftBanner } from "@/components/draft-banner";
import { generateTopicParams, resolveLearningRoute, topicCrumbs } from "../../../../navigation-data";
export const generateStaticParams = generateTopicParams;
export default async function NextPage({params}: {params:Promise<{area:string;subject:string;topic:string}>}) {
  const {area,subject,topic}=await params; const route=resolveLearningRoute(area,subject,topic);
  return <main id="main"><Breadcrumb items={[...topicCrumbs(route),{label:"Next steps",href:`${route.basePath}/next`}]} /><p className="eyebrow">Topic {route.meta.order} of {route.path.topics.length}</p><h1>Choose what comes next</h1>
    <DraftBanner note={route.topic.lesson.review_note} /><NextFlow topic={route.context} />
  </main>;
}
