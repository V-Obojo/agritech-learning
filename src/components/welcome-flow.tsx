"use client";
import Link from "next/link";
import type { Catalog } from "@/lib/content/schemas";
import { resumePath } from "@/lib/progress";
import { useProgress } from "./use-progress";
import { IntentionPicker } from "./intention-picker";
export function WelcomeFlow({catalog,areas}: {catalog:Catalog;areas:{id:string;href:string}[]}) {
  const {progress,ready}=useProgress();
  return <main id="main"><h1>{catalog.product.name}</h1><p className="eyebrow">by {catalog.product.parent}</p><p className="lead">{catalog.product.tagline}</p><p>{catalog.product.pitch}</p>
    {ready && progress.lastPath && <section className="card resume-card"><h2>Welcome back</h2><p>Your saved progress is ready.</p><Link className="button" href={resumePath(progress)}>Continue where you left off</Link></section>}
    <IntentionPicker intentions={catalog.intentions} />
    <section aria-labelledby="areas-title"><h2 id="areas-title">Explore an area</h2><div className="card-grid">{catalog.areas.map(area => <Link className={`card navigation-card ${area.status==="coming-soon" ? "muted-card" : ""}`} key={area.id} href={areas.find(link=>link.id===area.id)!.href}>
      <span className={`badge ${area.status==="live" ? "badge-done" : "badge-soon"}`}>{area.status==="live" ? "Available" : "Coming soon"}</span><h3>{area.label}</h3><p>{area.blurb}</p>
      {area.status==="coming-soon" && <div className="chips muted-chips">{area.subjects.map(subject=><span className="chip" key={subject.id}>{subject.label}</span>)}</div>}
    </Link>)}</div></section>
  </main>;
}
