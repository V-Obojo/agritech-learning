"use client";
import {useId,useState} from "react";
import {motion} from "motion/react";
import {useLabReducedMotion} from "./use-lab-reduced-motion";
import {observationSchema,type SceneElement} from "@/lib/labs/definitions";
import {evaluateTap,sceneScore,overallScore,observationState,observationCompletion} from "@/lib/labs/observation";
import {Citations,type SimulationProps} from "./simulation-ui";

function Fish({small=false}:{small?:boolean}) {
  const skin=useId();
  return <g transform={small?"scale(.6)":undefined}><defs><linearGradient id={skin} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#42574b"/><stop offset=".55" stopColor="#809781"/><stop offset="1" stopColor="#d8d9bb"/></linearGradient></defs>
    <path d="M-31-9Q-15-23 28-13L26-6Q0-11-31-3Z" fill="#738d73" stroke="#adbea0" strokeWidth="1"/>
    {[-23,-13,-3,7,17].map(x=><path key={x} d={`M${x} -8l-3 -8`} stroke="#c3ccaa" strokeWidth=".7"/>)}
    <path d="M-31-9C-14-15 5-16 26-12Q43-13 45-4Q47 4 34 9C10 17-18 13-32 9L-48 20Q-41 0-48-19Z" fill={`url(#${skin})`} stroke="#405d53" strokeWidth="1"/>
    <path d="M-20 10Q0 20 27 10L25 15Q-4 23-20 13" fill="#84967a"/>
    <path d="M-38-9L-44-14M-36-3L-43-4M-36 3L-44 6M-39 10L-44 14" stroke="#b6bea0" strokeWidth=".8"/>
    <path d="M39-4Q61-18 48-24Q38-25 31-19M39 4Q61 11 47 24Q32 27 24 19M36 8Q45 18 34 21" fill="none" stroke="#d6d8b9" strokeWidth="1.3"/>
    <circle cx="33" cy="-5" r="2.5" fill="#102923"/><circle cx="34" cy="-6" r=".8" fill="#eeeedd"/><path d="M44 2L33 4" stroke="#243c33" strokeWidth="1.3"/>
    <path d="M20 10L29 19L11 13" fill="#acb59b"/>
  </g>;
}
function Visual({element,reduced}:{element:SceneElement;reduced:boolean}) {
  const animation=reduced?{x:0,y:0}:{x:[0,element.visual==="fish-weak"?4:12,0],y:[0,-3,0]};
  const transition={duration:reduced?0:element.visual==="fish-weak"?6:2.5,repeat:reduced?0:Infinity};
  switch(element.visual) {
    case "fish-surface":return <motion.g animate={reduced?{y:0}:{y:[0,-7,0]}} transition={transition}><ellipse cx="0" cy="10" rx="37" ry="9" fill="#d5ebe2"/><path d="M-28 7C-33-8-19-29 1-27C24-28 31-9 25 7" fill="#7e9278" stroke="#405c50" strokeWidth="2"/><circle cx="-15" cy="-12" r="3" fill="#102923"/><circle cx="15" cy="-12" r="3" fill="#102923"/><path d="M-21 0Q-46-12-46-24M21 0Q47-12 46-24M-12 5Q-35 19-45 9M12 5Q35 19 45 9" fill="none" stroke="#d3d8b9" strokeWidth="2"/><circle cy="-3" r="7" fill="#253a2b"/>{[0,1,2].map(i=><motion.circle key={i} cx={28+i*10} r={5-i} fill="none" stroke="#dae9e4" strokeWidth="2" animate={reduced?{cy:-18-i*14,opacity:1}:{cy:[8,-38-i*8],opacity:[0,1,0]}} transition={{duration:reduced?0:2.5,repeat:reduced?0:Infinity,delay:reduced?0:i*.7}}/>)}</motion.g>;
    case "feed-floating":return <motion.g animate={animation} transition={transition}>{[-25,-5,18,35].map((x,i)=><circle key={x} cx={x} cy={i%2?8:-5} r="6" fill="#c09a58"/>)}</motion.g>;
    case "bird":return <g><ellipse rx="28" ry="18" fill="#f1efdb"/><circle cx="21" cy="-18" r="12" fill="#f1efdb"/><path d="M31-18L47-12L31-10M-8 17V37M12 17V37" stroke="#cfa158" strokeWidth="5" fill="#cfa158"/><circle cx="25" cy="-20" r="3" fill="#16322c"/><path d="M-21-1Q-5-20 14 5" stroke="#aab6a4" strokeWidth="5" fill="none"/></g>;
    case "water-muddy":return <motion.g animate={reduced?{rotate:0}:{rotate:[-8,8,-8]}} transition={{duration:reduced?0:8,repeat:reduced?0:Infinity}}><ellipse rx="42" ry="27" fill="#b19059"/><path d="M-34 0Q-17-10 0 0T34 0M-24 16Q0 4 24 16" fill="none" stroke="#705f40" strokeWidth="4"/><path d="M-30-15C-4-37 43-9 26 12C9 31-26 20-12 1C-1-12 18-1 5 10" fill="none" stroke="#d2b07b" strokeWidth="3" opacity=".8"/></motion.g>;
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
  function tap(id:string) {if(!ready||state.summary)return;const result=evaluateTap(scene,id,taps);if(!result.element)return;setSelected({sceneId:scene.id,id});onChange({...state,taps:{...state.taps,[scene.id]:result.taps}});}
  return <div className="simulator observation" data-simulator="observation">{config.exampleNote&&<p className="sim-example">{config.exampleNote}</p>}
    <div className="observation-stepper" aria-label="Observation scenes">{config.scenes.map(s=><button disabled={!ready} key={s.id} aria-pressed={!state.summary&&s.id===scene.id} onClick={()=>onChange({...state,sceneId:s.id,summary:false})}>{sceneScore(s,state.taps[s.id]??[]).completed?"✓ ":""}{s.title}</button>)}<button disabled={!ready||!completion.completed} aria-pressed={state.summary} onClick={()=>onChange({...state,summary:true})}>See results</button></div>
<aside className="sim-visual observation-visual">      <h4>{scene.title}</h4><p>{scene.context}</p><svg className="observation-canvas" viewBox="0 0 560 340" aria-label={scene.title}><title>{scene.context}</title><defs><linearGradient id={`${lab.id}-water`} x1="0" y1="0" x2="0" y2="1"><stop stopColor={scene.elements.some(e=>e.visual==="water-muddy")?"#b39a73":"#73b3ae"}/><stop offset="1" stopColor={scene.elements.some(e=>e.visual==="water-muddy")?"#786d4e":"#276b76"}/></linearGradient><linearGradient id={`${lab.id}-light`}><stop stopColor="#fff7c8" stopOpacity=".24"/><stop offset="1" stopColor="#fff7c8" stopOpacity="0"/></linearGradient><clipPath id={`${lab.id}-pond`}><ellipse cx="280" cy="190" rx="251" ry="120"/></clipPath></defs>
      <g pointerEvents="none"><rect width="560" height="340" fill="#b3c098"/><ellipse cx="280" cy="194" rx="260" ry="128" fill="#7b8862"/><ellipse cx="280" cy="190" rx="253" ry="122" fill={`url(#${lab.id}-water)`}/>
      <g clipPath={`url(#${lab.id}-pond)`}>{[0,1,2,3].map(i=><path key={i} d={`M${30+i*65} 50L${240+i*85} 340H${310+i*85}L${70+i*65} 50Z`} fill={`url(#${lab.id}-light)`}/>)}{[0,1,2,3].map(i=><motion.ellipse key={i} cx={80+i*125} cy={140+i%2*90} fill="none" stroke="#c2e0ce" strokeWidth="1.5" animate={reduced?{rx:32,ry:7,opacity:.3}:{rx:[24,45,24],ry:[5,10,5],opacity:[.5,.12,.5]}} transition={{duration:reduced?0:5+i,repeat:reduced?0:Infinity}}/>)}</g>
      {[0,1,2,3,4,5,6,7,8].map(i=><g key={i}><path d={`M${28+i*62} 54q-10-17-5-28M${28+i*62} 54q4-23 13-25M${30+i*62} 54v-19M${28+i*62} 326q-10-17-5-22M${28+i*62} 326q4-19 13-23`} fill="none" stroke="#6b8852" strokeWidth="2"/><ellipse cx={45+i*57} cy="326" rx="5" ry="3" fill="#989778"/></g>)}
      <path d="M45 125Q280 55 510 125M55 263Q280 318 505 263" fill="none" stroke="#91c7bf" strokeWidth="2" opacity=".6"/></g>
      {scene.elements.map(e=>{const [x,y]=locations[e.visual];return <g key={e.id} data-element-id={e.id} className="observation-element" role="button" tabIndex={ready&&!state.summary?0:-1} aria-disabled={!ready||state.summary} aria-label={e.label} aria-pressed={taps.includes(e.id)} data-picked={taps.includes(e.id)} data-sign={e.isSign} transform={`translate(${x} ${y})`} onClick={()=>tap(e.id)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();tap(e.id);}}}><rect x="-50" y="-50" width="100" height="100" rx="15" fill="transparent"/><Visual element={e} reduced={reduced}/></g>;})}
      </svg><p className="sim-readout" aria-live="polite" data-testid="scene-score">Found {score.found} of {score.total} signs · Score: {score.score} / 100</p></aside>
    <div className="sim-controls">
    {state.summary?<div className="observation-summary"><h4>Observation results</h4><p data-testid="overall-score">Score: {overallScore(config,state.taps)} / 100</p>{config.scenes.map(s=>{const result=sceneScore(s,state.taps[s.id]??[]);return <p key={s.id}>{s.title}: {result.score} / 100 · Found {result.found} of {result.total} signs</p>;})}<p>{config.remedy.text}</p><Citations chunks={[config.remedy.chunk]}/><button onClick={()=>onChange({...state,summary:false})}>Back to scenes</button></div>:<>

      <div className="observation-items">{scene.elements.map(e=><button key={e.id} data-element-id={e.id} data-sign={e.isSign} data-picked={taps.includes(e.id)} disabled={!ready} aria-pressed={taps.includes(e.id)} onClick={()=>tap(e.id)}>{e.label}{taps.includes(e.id)&&e.isSign?" ✓":""}</button>)}</div>
      {active&&<div className="sim-feedback observation-feedback" data-kind={active.isSign?"sign":"neutral"} aria-live="polite"><strong>{active.label}</strong><p>{active.explain}</p>{active.chunk&&<Citations chunks={[active.chunk]}/>}</div>}

      <div className="lab-toolbar">{config.scenes.indexOf(scene)>0&&<button onClick={()=>onChange({...state,sceneId:config.scenes[config.scenes.indexOf(scene)-1].id})}>Previous scene</button>}{config.scenes.indexOf(scene)<config.scenes.length-1&&<button onClick={()=>onChange({...state,sceneId:config.scenes[config.scenes.indexOf(scene)+1].id})}>Next scene</button>}</div>
    </>}
    </div>
  </div>;
}
