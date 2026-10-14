"use client";
import { useState } from "react";
import Link from "next/link";
import type { Catalog, SubjectPath } from "@/lib/content/schemas";
import { topicKey, topicStatus } from "@/lib/progress";
import { useProgress } from "./use-progress";
import { IntentionPicker } from "./intention-picker";
import { motion, useReducedMotion } from "motion/react";
export function SubjectHub({path,intentions,links}: {path:SubjectPath;intentions:Catalog["intentions"];links:{id:string;href:string}[]}) {
  const {progress}=useProgress(); const [changing,setChanging]=useState(false);
  const ordered=[...path.topics].sort((a,b)=>a.order-b.order);
  const next=ordered.find(topic=>topic.status==="live" && topicStatus(progress,topicKey(path.subject,topic.id))!=="done");
  const selected=next ?? ordered.find(topic=>topic.status==="live");
  const started=Object.keys(progress.topics).some(key=>key.startsWith(`${path.subject}/`) && topicStatus(progress,key)!=="not-started");
  const intention=intentions.find(item=>item.id===progress.intention);
  const live=ordered.filter(topic=>topic.status==="live");
  const done=live.filter(topic=>topicStatus(progress,topicKey(path.subject,topic.id))==="done").length;
  const reduce=useReducedMotion();
  return <div className="hub-layout"><aside className="card hub-summary"><div className="progress-ring" role="img" aria-label={`${done} of ${live.length} live topics done`}><svg viewBox="0 0 100 100" aria-hidden="true"><circle className="ring-track" cx="50" cy="50" r="42" /><motion.circle className="ring-value" cx="50" cy="50" r="42" pathLength="1" strokeDasharray="1" initial={false} animate={{strokeDashoffset:1-done/live.length}} transition={{duration:reduce ? 0 : .6}} /></svg><strong>{done}<small>of {live.length} done</small></strong></div><h2>{path.hubCard.title}</h2><section className="intention-line">{intention && <p>You’re here because: {intention.label} <button className="text-button" type="button" onClick={()=>setChanging(!changing)} aria-expanded={changing}>Change</button></p>}
    {(changing || !intention) && <IntentionPicker intentions={intentions} name="hub-intention" legend={path.hubCard.intentionPrompt} />}</section>
    {selected && <div className="actions"><Link className="button" href={links.find(link=>link.id===selected.id)!.href}>{!started ? "Start" : `${next ? "Continue" : "Review"}: ${selected.title}`}</Link></div>}
    <p className="eyebrow">{path.hubCard.note}</p></aside><div><section className="card learning-outcomes"><h2>What you’ll learn</h2><ul>{path.whatYouWillLearn.map(item=><li key={item}>{item}</li>)}</ul></section><h2>Your learning path</h2><ol className="topic-path">{ordered.map(topic=>{
      const status=topicStatus(progress,topicKey(path.subject,topic.id));
      const badge=topic.status==="coming-soon" ? "Coming soon" : status==="done" ? "Done" : topic.id===next?.id ? "Up next" : status==="in-progress" ? "In progress" : "Not started";
      const content=<><span className="topic-number">{topic.order}</span><div><span className={`badge ${badge==="Done" ? "badge-done" : badge==="Coming soon" ? "badge-soon" : "badge-next"}`}>{badge}</span><h3>{topic.title}</h3><p>{topic.summary}</p></div></>;
      return <li key={topic.id}>{topic.status==="live" ? <Link className="card topic-card navigation-card" href={links.find(link=>link.id===topic.id)!.href}>{content}</Link> : <div className="card topic-card muted-card">{content}</div>}</li>;
    })}</ol></div>
  </div>;
}
