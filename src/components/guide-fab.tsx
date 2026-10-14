"use client";
import {useRef,useState} from "react";
import {GuidePanel} from "./guide-panel";
import {StuckHelp} from "./stuck-help";
import type {LearningContext} from "./learning-types";

export function GuideFab({topic}:{topic:LearningContext}) {
  const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
  const [open,setOpen]=useState(false);
  function close(){dialog.current?.close();}
  return <>
    <button ref={trigger} className="guide-trigger" aria-haspopup="dialog" aria-expanded={open} aria-controls="lesson-guide-dialog" onClick={()=>{dialog.current?.showModal();setOpen(true);}}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M20 11a8 8 0 0 1-8 8H5l-3 3V11a9 9 0 0 1 18 0Z"/><path d="M7 10h8M7 14h5"/></svg>Ask the guide</button>
    <dialog ref={dialog} id="lesson-guide-dialog" className="guide-sheet" aria-labelledby="lesson-guide-title" onClose={()=>{setOpen(false);trigger.current?.focus({preventScroll:true});}} onClick={event=>{if(event.target===event.currentTarget)close();}} onKeyDown={event=>{
      if(event.key!=="Tab")return;
      const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled),a[href],textarea:not(:disabled),input:not(:disabled),summary,[tabindex="0"]')).filter(element=>element.getClientRects().length>0);
      const first=controls[0],last=controls.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
    }}><div className="sheet-content"><header className="guide-sheet-header"><h2 id="lesson-guide-title">Learning guide</h2><button className="secondary sheet-close" onClick={close} aria-label="Close guide">Close ×</button></header><GuidePanel topic={topic} onCitation={()=>{if(matchMedia("(max-width: 1023px)").matches)close();}}/><StuckHelp step="lesson" topic={topic} label="Help with the lesson" /></div></dialog>
  </>;
}
