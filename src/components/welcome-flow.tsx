"use client";
import Link from "next/link";
import type { Catalog } from "@/lib/content/schemas";
import { resumePath } from "@/lib/progress";
import { useProgress } from "./use-progress";
import { IntentionPicker } from "./intention-picker";
import { Reveal, AnimatedLink } from "./motion-surface";
export function WelcomeFlow({catalog,areas}: {catalog:Catalog;areas:{id:string;href:string}[]}) {
  const {progress,ready}=useProgress();
  const start=areas.find(link=>link.id===catalog.areas.find(area=>area.status==="live")?.id)?.href ?? "/";
  return <main id="main"><section className="hero"><div className="hero-orbit" aria-hidden="true"><span /><span /><span /></div><Reveal><p className="eyebrow">A little curiosity. A world of possibilities.</p><h1>{catalog.product.name}</h1><p className="lead">{catalog.product.tagline}</p><p className="hero-pitch">{catalog.product.pitch}</p><div className="actions"><Link className="button" href={start}>Start learning →</Link><Link className="button secondary" href="/labs">Explore labs</Link></div></Reveal></section>
    {ready && progress.lastPath && <section className="card resume-card"><h2>Welcome back</h2><p>Your saved progress is ready.</p><Link className="button" href={resumePath(progress)}>Continue where you left off</Link></section>}
    <IntentionPicker intentions={catalog.intentions} />
    <section id="areas" aria-labelledby="areas-title"><h2 id="areas-title">Explore an area</h2><div className="card-grid">{catalog.areas.map((area,index) => <AnimatedLink index={index} className={`card navigation-card ${area.status==="coming-soon" ? "muted-card" : ""}`} key={area.id} href={areas.find(link=>link.id===area.id)!.href}>
      <span className="area-symbol" aria-hidden="true">{["↗","✳","◈"][index % 3]}</span><span className={`badge ${area.status==="live" ? "badge-done" : "badge-soon"}`}>{area.status==="live" ? "Available" : "Coming soon"}</span><h3>{area.label}</h3><p>{area.blurb}</p>
      {area.status==="coming-soon" && <div className="chips muted-chips">{area.subjects.map(subject=><span className="chip" key={subject.id}>{subject.label}</span>)}</div>}
      <span className="card-arrow" aria-hidden="true">↗</span>
    </AnimatedLink>)}</div></section>
  </main>;
}
