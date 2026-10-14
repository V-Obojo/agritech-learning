"use client";
import { useEffect, useState } from "react";
import { GuideFab } from "./guide-fab";

import type { LearningContext } from "./learning-types";

export function LessonContents({ chunks }: { chunks: {id:string;title:string}[] }) {
  const [active,setActive]=useState(chunks[0]?.id ?? "");
  useEffect(()=>{
    const observer=new IntersectionObserver(entries=>{
      const visible=entries.filter(entry=>entry.isIntersecting).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top);
      if(visible[0]) setActive(visible[0].target.id);
    },{rootMargin:"-100px 0px -55% 0px",threshold:0});
    for(const chunk of chunks) { const element=document.getElementById(chunk.id);if(element) observer.observe(element); }
    return ()=>observer.disconnect();
  },[chunks]);
  const links=<nav aria-label="Lesson contents"><p className="eyebrow">In this lesson</p>{chunks.map((chunk,index)=><a key={chunk.id} href={`#${chunk.id}`} aria-current={active===chunk.id ? "location" : undefined}><span>{String(index+1).padStart(2,"0")}</span>{chunk.title}</a>)}</nav>;
  return <aside className="lesson-toc"><div className="toc-desktop">{links}</div><details className="toc-dropdown"><summary>In this lesson</summary>{links}</details></aside>;
}
export function LessonGuide({ topic }: {topic:LearningContext}) { return <GuideFab topic={topic} />; }
