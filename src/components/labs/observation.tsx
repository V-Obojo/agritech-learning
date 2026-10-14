"use client";
import {useState} from "react";
import {motion} from "motion/react";
import {useLabReducedMotion} from "./use-lab-reduced-motion";
import {observationSchema,type SceneElement} from "@/lib/labs/definitions";
import {evaluateTap,sceneScore,overallScore,observationState,observationCompletion} from "@/lib/labs/observation";
import {Citations,type SimulationProps} from "./simulation-ui";

function Fish({small=false}:{small?:boolean}) {return <g transform={small?"scale(.6)":undefined}><path d="M-25 0L-47-17V17Z" fill="#52664f"/><ellipse rx="34" ry="15" fill="#8b9471"/><circle cx="21" cy="-5" r="3" fill="#0b2521"/></g>;}
function Visual({element,reduced}:{element:SceneElement;reduced:boolean}) {
  const animation=reduced?{x:0,y:0}:{x:[0,element.visual==="fish-weak"?4:12,0],y:[0,-3,0]};
  const transition={duration:reduced?0:element.visual==="fish-weak"?6:2.5,repeat:reduced?0:Infinity};
  switch(element.visual) {
    case "fish-surface":return <motion.g animate={reduced?{y:0}:{y:[0,-7,0]}} transition={transition}><ellipse cx="0" cy="10" rx="37" ry="9" fill="#d5ebe2"/><path d="M-22 6Q0-37 22 6Z" fill="#6c785c"/><circle cy="-3" r="7" fill="#253a2b"/><circle cx="33" cy="-21" r="5" fill="none" stroke="#dae9e4" strokeWidth="3"/><circle cx="19" cy="-37" r="3" fill="#dae9e4"/></motion.g>;
    case "feed-floating":return <motion.g animate={animation} transition={transition}>{[-25,-5,18,35].map((x,i)=><circle key={x} cx={x} cy={i%2?8:-5} r="6" fill="#c09a58"/>)}</motion.g>;
    case "bird":return <g><ellipse rx="28" ry="18" fill="#f1efdb"/><circle cx="21" cy="-18" r="12" fill="#f1efdb"/><path d="M31-18L47-12L31-10M-8 17V37M12 17V37" stroke="#cfa158" strokeWidth="5" fill="#cfa158"/><circle cx="25" cy="-20" r="3" fill="#16322c"/><path d="M-21-1Q-5-20 14 5" stroke="#aab6a4" strokeWidth="5" fill="none"/></g>;
    case "water-muddy":return <g><ellipse rx="42" ry="27" fill="#b19059"/><path d="M-34 0Q-17-10 0 0T34 0M-24 16Q0 4 24 16" fill="none" stroke="#705f40" strokeWidth="4"/></g>;
    case "fish-swimming":return <motion.g animate={animation} transition={{...transition,duration:reduced?0:1.8}}><Fish/></motion.g>;
    case "leaves":return <motion.g animate={animation} transition={{...transition,duration:reduced?0:5}}><path d="M-33 8Q-24-25 3-9Q-4 18-33 8M15 16Q13-13 38-14Q39 12 15 16" fill="#b5b05d"/><path d="M-28 5L0-7M18 12L35-10" stroke="#677948" strokeWidth="2"/></motion.g>;
    case "fish-feeding":return <motion.g animate={reduced?{scale:1}:{scale:[1,.88,1]}} transition={transition}><g transform="translate(-22 -18) rotate(25)"><Fish small/></g><g transform="translate(25 15) rotate(-140)"><Fish small/></g><g transform="translate(-18 25) rotate(-25)"><Fish small/></g><circle cx="5" cy="-6" r="5" fill="#c09a58"/></motion.g>;
    case "fish-weak":return <motion.g animate={reduced?{rotate:18,x:0,y:0}:{...animation,rotate:[15,23,15]}} transition={transition}><Fish/></motion.g>;
    case "smell":return <motion.g animate={reduced?{y:0,opacity:1}:{y:[5,-10,5],opacity:[.5,1,.5]}} transition={transition}>{[-24,0,24].map(x=><path key={x} d={`M${x} 27Q${x-14} 10 ${x} -5T${x} -35`} fill="none" stroke="#bcb99a" strokeWidth="5" strokeLinecap="round"/>)}</motion.g>;
  }
}
const locations:Record<SceneElement["visual"],[number,number]>={"fish-surface":[130,160],"feed-floating":[315,135],bird:[460,75],"water-muddy":[100,190],"fish-swimming":[300,200],leaves:[460,200],"fish-feeding":[130,190],"fish-weak":[325,220],smell:[455,130]};
export default function Observation({lab,data,ready,onChange}:SimulationProps) {
  const config=observationSchema.parse(lab),state=observationState(config,data),scene=config.scenes.find(s=>s.id===state.sceneId)!,taps=state.taps[scene.id]??[];
  const [selected,setSelected]=useState<{sceneId:string;id:string}|null>(null),reduced=useLabReducedMotion(),score=sceneScore(scene,taps),completion=observationCompletion(config,state);
  const active=selected?.sceneId===scene.id?scene.elements.find(e=>e.id===selected.id):undefined;
  function tap(id:string) {if(!ready)return;const result=evaluateTap(scene,id,taps);if(!result.element)return;setSelected({sceneId:scene.id,id});onChange({...state,taps:{...state.taps,[scene.id]:result.taps}});}
  return <div className="simulator observation" data-simulator="observation">{config.exampleNote&&<p className="sim-example">{config.exampleNote}</p>}
    <div className="observation-stepper" aria-label="Observation scenes">{config.scenes.map(s=><button disabled={!ready} key={s.id} aria-pressed={!state.summary&&s.id===scene.id} onClick={()=>onChange({...state,sceneId:s.id,summary:false})}>{sceneScore(s,state.taps[s.id]??[]).completed?"✓ ":""}{s.title}</button>)}<button disabled={!ready||!completion.completed} aria-pressed={state.summary} onClick={()=>onChange({...state,summary:true})}>See results</button></div>
    {state.summary?<div className="observation-summary"><h4>Observation results</h4><p data-testid="overall-score">Score: {overallScore(config,state.taps)} / 100</p>{config.scenes.map(s=>{const result=sceneScore(s,state.taps[s.id]??[]);return <p key={s.id}>{s.title}: {result.score} / 100 · Found {result.found} of {result.total} signs</p>;})}<p>{config.remedy.text}</p><Citations chunks={[config.remedy.chunk]}/><button onClick={()=>onChange({...state,summary:false})}>Back to scenes</button></div>:<>
      <h4>{scene.title}</h4><p>{scene.context}</p><svg className="observation-canvas" viewBox="0 0 560 340" aria-label={scene.title}><title>{scene.context}</title><rect width="560" height="340" fill="#b7c7a0"/><ellipse cx="280" cy="190" rx="258" ry="125" fill={scene.elements.some(e=>e.visual==="water-muddy")?"#a58b61":"#3d8792"}/><path d="M45 125Q280 55 510 125M55 263Q280 318 505 263" fill="none" stroke="#79b7b6" strokeWidth="4"/>
      {scene.elements.map(e=>{const [x,y]=locations[e.visual];return <g key={e.id} data-element-id={e.id} className="observation-element" role="button" tabIndex={ready?0:-1} aria-disabled={!ready} aria-label={e.label} aria-pressed={taps.includes(e.id)} data-picked={taps.includes(e.id)} data-sign={e.isSign} transform={`translate(${x} ${y})`} onClick={()=>tap(e.id)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();tap(e.id);}}}><rect x="-50" y="-50" width="100" height="100" rx="15" fill="transparent"/><Visual element={e} reduced={reduced}/></g>;})}
      </svg><p className="sim-readout" aria-live="polite" data-testid="scene-score">Found {score.found} of {score.total} signs · Score: {score.score} / 100</p>
      <div className="observation-items">{scene.elements.map(e=><button key={e.id} data-element-id={e.id} data-sign={e.isSign} data-picked={taps.includes(e.id)} disabled={!ready} aria-pressed={taps.includes(e.id)} onClick={()=>tap(e.id)}>{e.label}{taps.includes(e.id)&&e.isSign?" ✓":""}</button>)}</div>
      {active&&<div className="sim-feedback observation-feedback" data-kind={active.isSign?"sign":"neutral"} aria-live="polite"><strong>{active.label}</strong><p>{active.explain}</p>{active.chunk&&<Citations chunks={[active.chunk]}/>}</div>}
      <div className="lab-toolbar">{config.scenes.indexOf(scene)>0&&<button onClick={()=>onChange({...state,sceneId:config.scenes[config.scenes.indexOf(scene)-1].id})}>Previous scene</button>}{config.scenes.indexOf(scene)<config.scenes.length-1&&<button onClick={()=>onChange({...state,sceneId:config.scenes[config.scenes.indexOf(scene)+1].id})}>Next scene</button>}</div>
    </>}
  </div>;
}
