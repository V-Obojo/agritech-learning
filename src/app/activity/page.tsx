import { getActivity, getLesson } from "@/lib/content";
import { ActivityFlow } from "@/components/activity-flow";
import { DraftBanner } from "@/components/draft-banner";
export default function ActivityPage() {
  return <main id="main"><p className="eyebrow">Step 2 · Try a small activity</p><h1>{getActivity().title}</h1>
    <DraftBanner note={getLesson().review_note} /><ActivityFlow activity={getActivity()} /></main>;
}
