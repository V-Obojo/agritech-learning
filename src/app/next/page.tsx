import { getLesson, getPathway } from "@/lib/content";
import { NextFlow } from "@/components/next-flow";
import { DraftBanner } from "@/components/draft-banner";
export default function NextPage() {
  return <main id="main"><p className="eyebrow">Step 3 · Choose what comes next</p><h1>A useful first step</h1>
    <DraftBanner note={getLesson().review_note} /><NextFlow pathway={getPathway()} /></main>;
}
