"use client";
import Link from "next/link";
import type { Pathway } from "@/lib/content/schemas";
import { resumePath, updateProgress } from "@/lib/progress";
import { useProgress } from "./use-progress";
import { recordEvent } from "@/lib/metrics";
export function WelcomeFlow({ pathway }: { pathway: Pathway }) {
  const { progress, ready } = useProgress();
  return <main id="main">
    <p className="eyebrow">A first step for curious beginners in Nigeria</p>
    <h1>Start with water.<br />Learn at your pace.</h1>
    <p>Explore water availability for catfish farming, ask a guide, and try a small activity. You don’t need a farm or plans to invest.</p>
    <p>About 10 minutes. No sign-up.</p>
    <ol className="stage-strip" aria-label="Learning stages">{pathway.stages.map((stage) =>
      <li key={stage.id}>{stage.label}{!stage.active && <span> · coming later</span>}</li>)}</ol>
    {ready && progress.updatedAt && <div className="card"><h2>Welcome back</h2><p>Your saved progress is ready.</p><Link className="button" href={resumePath(progress)}>Continue where you left off</Link></div>}
    <fieldset disabled={!ready}><legend>What brings you here?</legend>
      {pathway.intentions.map((intention) => <label className="choice" key={intention.id}>
        <input type="radio" name="intention" checked={progress.intention === intention.id}
          onChange={() => { updateProgress({ intention: intention.id as NonNullable<typeof progress.intention> }); recordEvent("intention_chosen", { intention: intention.id }); }} />
        {intention.label}</label>)}
    </fieldset>
    {ready && progress.intention ? <Link className="button" href="/lesson">Start the lesson</Link> : <p>Choose an intention to begin.</p>}
  </main>;
}
