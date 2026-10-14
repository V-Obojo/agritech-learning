import { Breadcrumb } from "@/components/breadcrumb";
import { ActivityFlow } from "@/components/activity-flow";
import { DraftBanner } from "@/components/draft-banner";
import { generateTopicParams, resolveLearningRoute, topicCrumbs } from "../../../../navigation-data";
export const generateStaticParams = generateTopicParams;
export default async function ActivityPage({params}: {params:Promise<{area:string;subject:string;topic:string}>}) {
  const {area,subject,topic}=await params; const route=resolveLearningRoute(area,subject,topic);
  return <main id="main"><Breadcrumb items={[...topicCrumbs(route),{label:"Activity",href:`${route.basePath}/activity`}]} /><p className="eyebrow">Topic {route.meta.order} of {route.path.topics.length} · Try a small activity</p><h1>{route.topic.activity.title}</h1>
    <DraftBanner note={route.topic.lesson.review_note} /><ActivityFlow activity={route.topic.activity} topic={route.context} />
  </main>;
}
