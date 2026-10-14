"use client";
import Image from "next/image";
import {useEffect,useRef,useState} from "react";
import type {Media} from "@/lib/content/media-labs";
import "./media.css";

export function Credit({media}:{media:Media}) {
  return <p className="media-credit">Photo: <a href={media.sourceUrl} target="_blank" rel="noreferrer">{media.credit}</a> · {media.licenseUrl?<a href={media.licenseUrl} target="_blank" rel="noreferrer">{media.license}</a>:media.license}</p>;
}
export function Figure({media}:{media:Media}) {
  const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
  const [open,setOpen]=useState(false),[view,setView]=useState({zoom:1,x:0,y:0,angle:0});
  const points=useRef(new Map<number,{x:number;y:number}>()),lastTap=useRef(0);
  const reset=()=>setView({zoom:1,x:0,y:0,angle:0});
  const zoom=(factor:number)=>setView(v=>({...v,zoom:Math.max(.5,Math.min(6,v.zoom*factor))}));
  const close=()=>{dialog.current?.close();setOpen(false);trigger.current?.focus();};
  useEffect(()=>{
    if(!open) return;
    dialog.current?.showModal();
    const previous=document.body.style.overflow;document.body.style.overflow="hidden";
    return ()=>{document.body.style.overflow=previous;};
  },[open]);
  return <figure className="lesson-figure" data-media-id={media.id}>
    <button className="figure-open" ref={trigger} aria-label={`Enlarge image: ${media.alt}`} onClick={()=>{reset();setOpen(true);}}><Image src={media.file} width={media.width} height={media.height} sizes="(max-width: 767px) 100vw, 700px" alt={media.alt}/><span>Enlarge ↗</span></button>
    <figcaption>{media.caption}<Credit media={media}/></figcaption>
    <dialog ref={dialog} className="figure-lightbox" aria-label="Image viewer" aria-modal="true" onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===dialog.current) close();}} onKeyDown={event=>{
      const key=event.key;
      if(key==="Escape") {event.preventDefault();close();}
      if(key==="+"||key==="=") {event.preventDefault();zoom(1.2);}
      if(key==="-") {event.preventDefault();zoom(1/1.2);}
      if(key.toLowerCase()==="r") {event.preventDefault();reset();}
      if(key.startsWith("Arrow")&&!(event.target instanceof HTMLInputElement)) {event.preventDefault();setView(v=>({...v,x:v.x+(key==="ArrowLeft"?-30:key==="ArrowRight"?30:0),y:v.y+(key==="ArrowUp"?-30:key==="ArrowDown"?30:0)}));}
    }}>
      {open&&<div className="lightbox-content"><div className="media-toolbar"><button autoFocus onClick={close}>Close image viewer</button><button aria-label="Zoom in" onClick={()=>zoom(1.2)}>+</button><button aria-label="Zoom out" onClick={()=>zoom(1/1.2)}>−</button><button aria-label="Rotate left" onClick={()=>setView(v=>({...v,angle:v.angle-90}))}>↶</button><button aria-label="Rotate right" onClick={()=>setView(v=>({...v,angle:v.angle+90}))}>↷</button><button onClick={reset}>Reset image</button><label>Rotation <input type="range" aria-label="Free rotation" min={-180} max={180} value={((view.angle+180)%360+360)%360-180} onChange={e=>setView(v=>({...v,angle:Number(e.target.value)}))}/></label></div>
      <div className="lightbox-stage" onWheel={e=>zoom(e.deltaY<0?1.1:1/1.1)} onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const now=Date.now();if(e.pointerType==="touch"&&points.current.size===1&&now-lastTap.current<300) zoom(1.5);lastTap.current=now;}} onDoubleClick={()=>zoom(1.5)} onPointerMove={e=>{
        const old=points.current.get(e.pointerId);if(!old) return;
        const other=[...points.current.entries()].find(([id])=>id!==e.pointerId)?.[1];
        if(other) {const before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(e.clientX-other.x,e.clientY-other.y);if(before>0) zoom(after/before);}
        else setView(v=>({...v,x:v.x+e.clientX-old.x,y:v.y+e.clientY-old.y}));
        points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
      }} onPointerUp={e=>points.current.delete(e.pointerId)} onPointerCancel={e=>points.current.delete(e.pointerId)} onLostPointerCapture={e=>points.current.delete(e.pointerId)}>
        <Image className="lightbox-image" data-testid="lightbox-image" src={media.file} width={media.width} height={media.height} sizes="100vw" alt={media.alt} draggable={false} style={{transform:`translate(${view.x}px, ${view.y}px) rotate(${view.angle}deg) scale(${view.zoom})`}}/>
      </div><p>{media.caption}</p><Credit media={media}/><p className="hint">Drag to pan · Scroll or pinch to zoom · + / − zoom · Arrows pan · R reset · Esc close</p></div>}
    </dialog>
  </figure>;
}
