"use client";
import dynamic from "next/dynamic";
import {useEffect,useRef,useState} from "react";
import type {Lab,Media} from "@/lib/content/media-labs";
import type {BadgeDefinition} from "@/lib/insights/calculators";
import {useProgress} from "../use-progress";
import {loadProgress,updateProgress} from "@/lib/progress";
import {recordEvent} from "@/lib/metrics";
import {explore,explorationStatus,readExploration} from "./progress";
import {simulationStatus} from "@/lib/labs/status";
import "./labs.css";
import "./simulators.css";

const ModelViewer=dynamic(()=>import("./model-viewer"),{ssr:false,loading:()=> <div className="lab-skeleton" role="status">Loading interactive model…</div>});
const loading=()=> <div className="lab-skeleton" role="status">Loading interactive lab…</div>;
const WaterSimulator=dynamic(()=>import("./water-simulator"),{ssr:false,loading});
const PondBuilder=dynamic(()=>import("./pond-builder"),{ssr:false,loading});
const Observation=dynamic(()=>import("./observation"),{ssr:false,loading});
const registry={"model-viewer":ModelViewer,"water-simulator":WaterSimulator,"pond-builder":PondBuilder,observation:Observation};
export function LabFrameClient({lab,fallback,badge,media}:{lab:Lab;fallback?:Media;badge?:BadgeDefinition;media:Record<string,Media>}) {
  const {progress,ready}=useProgress(),frame=useRef<HTMLElement>(null),[full,setFull]=useState(false);
  const saved=progress.labs[lab.id],state=readExploration(saved?.data);
  const modelStatus=lab.type==="model-viewer"?explorationStatus(lab,state):null;
  const status=modelStatus??simulationStatus(lab,saved?.data);
  useEffect(()=>{
    const changed=()=>setFull(document.fullscreenElement===frame.current);document.addEventListener("fullscreenchange",changed);return ()=>document.removeEventListener("fullscreenchange",changed);
  },[]);
  function visit(kind:"hotspots"|"modes",id:string) {
    if(!ready||lab.type!=="model-viewer") return;
    const latest=loadProgress(),previous=latest.labs[lab.id],before=readExploration(previous?.data),next=explore(lab,before,{kind,id});
    if(JSON.stringify(before)===JSON.stringify(next)) return;
    const result=explorationStatus(lab,next),details={labId:lab.id,subjectId:lab.subjectId,topicId:lab.topicId};
    updateProgress({labs:{...latest.labs,[lab.id]:{data:next,completed:Boolean(previous?.completed)||result.completed,score:result.score,updatedAt:new Date().toISOString()}}});
    if(!previous) recordEvent("lab_started",details);
    recordEvent("lab_progress",details);
    if(result.completed&&!previous?.completed) recordEvent("lab_completed",details);
  }
  function change(data:unknown) {
    if(!ready||lab.type==="model-viewer")return;
    const result=simulationStatus(lab,data),latest=loadProgress(),previous=latest.labs[lab.id];
    if(previous&&JSON.stringify(previous.data)===JSON.stringify(result.data)&&previous.score===result.score)return;
    updateProgress({labs:{...latest.labs,[lab.id]:{data:result.data,completed:Boolean(previous?.completed)||result.completed,score:result.score,updatedAt:new Date().toISOString()}}});
    const details={labId:lab.id,subjectId:lab.subjectId,topicId:lab.topicId};if(!previous)recordEvent("lab_started",details);recordEvent("lab_progress",details);if(result.completed&&!previous?.completed)recordEvent("lab_completed",details);
  }
  const Simulation=lab.type!=="model-viewer"?registry[lab.type]:null;
  return <section id={lab.id} ref={frame} className={`lab-frame${full?" lab-expanded":""}`} aria-label={lab.title} data-lab-id={lab.id}>
    <header><p className="eyebrow">Interactive lab</p><h3>{lab.title}</h3><p>{lab.instructions}</p><button aria-pressed={full} onClick={async()=>{
      if(document.fullscreenElement===frame.current) {await document.exitFullscreen();return;}
      if(!full&&frame.current?.requestFullscreen) {try{await frame.current.requestFullscreen();return;}catch{/* Inline expansion also works when fullscreen is unavailable. */}}
      setFull(v=>!v);
    }}>{full?"Exit fullscreen":"Fullscreen lab"}</button></header>
    <div className="lab-progress" aria-live="polite"><progress max={status.total} value={status.done} aria-label="Lab completion"/><p>{modelStatus&&lab.type==="model-viewer"?`${modelStatus.hotspots} / ${lab.completion.hotspotsVisited} hotspots · ${modelStatus.modes} / ${lab.completion.modesViewed} modes`:`${status.done} / ${status.total} steps`}</p>{saved?.completed&&<p className="lab-completed" role="status">Completed! <span className="lab-badge">{badge?.emoji} {badge?.label}</span></p>}</div>
    {lab.type==="model-viewer"?<ModelViewer lab={lab} fallback={fallback} onVisit={visit} ready={ready}/>:Simulation?<Simulation lab={lab} data={saved?.data} media={media} ready={ready} onChange={change}/>:<p className="hint">Coming in a later update</p>}
  </section>;
}
