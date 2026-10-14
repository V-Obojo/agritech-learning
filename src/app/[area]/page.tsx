import { NavigationEvent } from "@/components/navigation-event";
import Link from "next/link";
import { Breadcrumb } from "@/components/breadcrumb";
import { areaPath, firstLiveHub, generateAreaParams, homePath, resolveArea, subjectPath } from "../navigation-data";
export const generateStaticParams = generateAreaParams;
export default async function AreaPage({params}: {params:Promise<{area:string}>}) {
  const {area:slug}=await params; const area=resolveArea(slug); const liveHub=firstLiveHub();
  return <main id="main"><NavigationEvent name="area_opened" areaId={area.id} /><Breadcrumb items={[{label:"Home",href:homePath},{label:area.label,href:areaPath(area.slug)}]} />
    {area.status==="coming-soon" && <span className="badge badge-soon">Coming soon</span>}<h1>{area.label}</h1><p>{area.blurb}</p>
    {area.status==="coming-soon" && <p>These subjects are coming soon. You can explore the available learning path while we prepare them.</p>}
    <div className="card-grid">{area.subjects.map(subject=><Link className={`card navigation-card ${subject.status==="coming-soon" ? "muted-card" : ""}`} key={subject.id} href={subjectPath(area.slug,subject.slug)}>
      <span className={`badge ${subject.status==="live" ? "badge-done" : "badge-soon"}`}>{subject.status==="live" ? "Available" : "Coming soon"}</span><h2>{subject.label}</h2><p>{subject.blurb}</p>
    </Link>)}</div>
    {area.status==="coming-soon" && liveHub && <div className="actions"><Link className="button" href={liveHub.href}>Explore {liveHub.label}</Link></div>}
  </main>;
}
