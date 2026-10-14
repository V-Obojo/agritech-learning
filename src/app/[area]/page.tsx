import { Suspense } from "react";
import { NavigationEvent } from "@/components/navigation-event";
import { AnimatedLink } from "@/components/motion-surface";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { areaPath, firstLiveHub, generateAreaParams, homePath, resolveArea, subjectPath } from "../navigation-data";
export const generateStaticParams = generateAreaParams;
export default function AreaPage(props: {params:Promise<{area:string}>}) {
  return <Suspense fallback={<main id="main" aria-busy="true"><p>Loading your learning path...</p></main>}><RouteContent {...props} /></Suspense>;
}
async function RouteContent({params}: {params:Promise<{area:string}>}) {
  const {area:slug}=await params; const area=resolveArea(slug); const liveHub=firstLiveHub();
  return <main id="main"><NavigationEvent name="area_opened" areaId={area.id} /><Breadcrumb items={[{label:"Home",href:homePath},{label:area.label,href:areaPath(area.slug)}]} />
    {area.status==="coming-soon" && <span className="badge badge-soon">Coming soon</span>}<div className="page-band"><h1>{area.label}</h1><p className="lead">{area.blurb}</p></div>
    {area.status==="coming-soon" && <p>These subjects are coming soon. You can explore the available learning path while we prepare them.</p>}
    <div className="card-grid subject-grid">{area.subjects.map((subject,index)=><AnimatedLink index={index} className={`card navigation-card ${subject.status==="coming-soon" ? "muted-card" : ""}`} key={subject.id} href={subjectPath(area.slug,subject.slug)}>
      <span className={`badge ${subject.status==="live" ? "badge-done" : "badge-soon"}`}>{subject.status==="live" ? "Available" : "Coming soon"}</span><h2>{subject.label}</h2><p>{subject.blurb}</p>
    </AnimatedLink>)}</div>
    {area.status==="coming-soon" && liveHub && <div className="actions"><Link className="button" href={liveHub.href}>Explore {liveHub.label}</Link></div>}
  </main>;
}
