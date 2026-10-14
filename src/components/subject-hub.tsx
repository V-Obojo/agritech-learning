"use client";
import { useState } from "react";
import Link from "next/link";
import type { Catalog, SubjectPath } from "@/lib/content/schemas";
import { topicKey, topicStatus } from "@/lib/progress";
import { useProgress } from "./use-progress";
import { IntentionPicker } from "./intention-picker";
export function SubjectHub({path,intentions,links}: {path:SubjectPath;intentions:Catalog["intentions"];links:{id:string;href:string}[]}) {
  const {progress,ready}=useProgress(); const [changing,setChanging]=useState(false);
  const ordered=[...path.topics].sort((a,b)=>a.order-b.order);
  const next=ordered.find(topic=>topic.status==="live" && topicStatus(progress,topicKey(path.subject,topic.id))!=="done");
  const selected=next ?? ordered.find(topic=>topic.status==="live");
  const started=Object.keys(progress.topics).some(key=>key.startsWith(`${path.subject}/`) && topicStatus(progress,key)!=="not-started");
  const intention=intentions.find(item=>item.id===progress.intention);
  return <><section className="intention-line"><p>You’re here because: {intention?.label ?? "Choose what brings you here"} <button className="text-button" type="button" onClick={()=>setChanging(!changing)} aria-expanded={changing}>Change</button></p>
    {(changing || (ready && !intention)) && <IntentionPicker intentions={intentions} name="hub-intention" />}</section>
    {selected && <div className="actions"><Link className="button" href={links.find(link=>link.id===selected.id)!.href}>{!started ? "Start" : `${next ? "Continue" : "Review"}: ${selected.title}`}</Link></div>}
    <h2>Your learning path</h2><ol className="topic-path">{ordered.map(topic=>{
      const status=topicStatus(progress,topicKey(path.subject,topic.id));
      const badge=topic.status==="coming-soon" ? "Coming soon" : status==="done" ? "Done" : status==="in-progress" ? "In progress" : "Up next";
      const content=<><span className="topic-number">{topic.order}</span><div><span className={`badge ${badge==="Done" ? "badge-done" : badge==="Coming soon" ? "badge-soon" : "badge-next"}`}>{badge}</span><h3>{topic.title}</h3><p>{topic.summary}</p></div></>;
      return <li key={topic.id}>{topic.status==="live" ? <Link className="card topic-card navigation-card" href={links.find(link=>link.id===topic.id)!.href}>{content}</Link> : <div className="card topic-card muted-card">{content}</div>}</li>;
    })}</ol>
  </>;
}
