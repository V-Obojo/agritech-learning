"use client";
import { useEffect, useRef, useState } from "react";
import { GuidePanel } from "./guide-panel";
import { StuckHelp } from "./stuck-help";
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
export function LessonGuide({ topic }: {topic:LearningContext}) {
  const sheet=useRef<HTMLDialogElement>(null);
  const [phone,setPhone]=useState<boolean | null>(null);
  const trigger=useRef<HTMLButtonElement>(null);
  useEffect(()=>{
    const media=matchMedia("(max-width: 767px)");
    const sync=()=>{sheet.current?.close();setPhone(media.matches);};
    sync();media.addEventListener("change",sync);return ()=>media.removeEventListener("change",sync);
  },[]);
  const content=<><GuidePanel topic={topic} onCitation={()=>sheet.current?.close()} /><StuckHelp step="lesson" topic={topic} label="Help with the lesson" /></>;
  return <aside className="lesson-guide">
    {phone===false && <div className="guide-desktop">{content}</div>}
    <button ref={trigger} className="guide-trigger" aria-haspopup="dialog" onClick={()=>sheet.current?.showModal()}>Ask the guide <span aria-hidden="true">↗</span></button>
    <dialog ref={sheet} className="guide-sheet" aria-label="Learning guide" onClose={()=>trigger.current?.focus()} onClick={event=>{if(event.target===event.currentTarget) sheet.current?.close();}}><div className="sheet-content"><button className="secondary sheet-close" onClick={()=>sheet.current?.close()} aria-label="Close guide">Close ×</button>{phone===true && content}</div></dialog>
  </aside>;
}
