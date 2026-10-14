"use client";
import {useEffect,useState} from "react";
import {motion} from "motion/react";
import {useLabReducedMotion} from "./use-lab-reduced-motion";
import {citationText} from "./citation-text";
import {waterSchema} from "@/lib/labs/definitions";
import {questionOptions,shortfallByMonth,waterCompletion,waterState} from "@/lib/labs/water-simulator";
import {Citations,InlineCitations,LabPhoto,type SimulationProps} from "./simulation-ui";

export default function WaterSimulator({lab,data,media,ready,onChange}:SimulationProps) {
  const config=waterSchema.parse(lab),state=waterState(config,data),source=config.sources.find(s=>s.id===state.sourceId)!;
  const [playing,setPlaying]=useState(false),reduced=useLabReducedMotion();
  const timeline=shortfallByMonth(config,source.id),current=timeline[state.month],status=waterCompletion(config,state);
  const maximum=Math.max(...config.sources.flatMap(s=>s.levels),config.pondNeed.dry,config.pondNeed.wet,1);
  useEffect(()=>{if(ready&&!state.explored.includes(state.sourceId))onChange({...state,explored:[...state.explored,state.sourceId]});},[ready,state,onChange]);
  useEffect(()=>{if(!playing||reduced||!ready)return;const timer=setInterval(()=>onChange({...state,month:(state.month+1)%config.months.length}),1000);return ()=>clearInterval(timer);},[playing,reduced,ready,state,onChange,config.months.length]);
  const point=(value:number,index:number)=>`${40+index/(config.months.length-1)*480},${170-value/maximum*135}`;
  return <div className="simulator water-simulator" data-simulator="water-simulator">
    <div className="sim-controls">
    <div className="sim-example">{citationText(config.exampleNote)}<InlineCitations text={config.exampleNote}/></div><p>{config.place}</p>
    <div className="sim-source-grid">{config.sources.map(s=><div key={s.id} className={`sim-source-card${source.id===s.id?" selected":""}`}><button disabled={!ready} aria-pressed={source.id===s.id} onClick={()=>onChange({...state,sourceId:s.id,explored:[...new Set([...state.explored,s.id])]})}>{s.label}</button>{s.media&&media[s.media]&&<LabPhoto media={media[s.media]}/>}</div>)}</div>
    <div className="sim-timeline"><div className="sim-months" aria-hidden="true">{config.months.map((m,index)=><span key={index} data-season={m.season} data-current={state.month===index} title={`${m.label}: ${m.season}`}>{index+1}</span>)}</div><label className="sim-slider">Year month<input aria-label="Year month" type="range" min={0} max={config.months.length-1} step={1} value={state.month} disabled={!ready} onChange={e=>{setPlaying(false);onChange({...state,month:Number(e.target.value)});}}/></label><div className="lab-toolbar"><button className="sim-play" title={playing&&!reduced?"Pause year":"Play year"} disabled={!ready||Boolean(reduced)} aria-pressed={playing&&!reduced} onClick={()=>setPlaying(p=>!p)}>{playing&&!reduced?"Pause year":"Play year"}</button><strong data-testid="current-month">{current.label} · {current.season}</strong></div></div>
    <p>{citationText(config.pondNeed.note)}<InlineCitations text={config.pondNeed.note}/></p><p className="hint">Sources explored: {status.sources} / {config.completion.sourcesExplored} · Correct answers: {status.questions} / {config.completion.questionsAnswered}</p>
    {config.questions.map(q=><fieldset key={q.id} disabled={!ready}><legend>{q.prompt}</legend>{questionOptions(config,q.answer).map(option=><label className="choice" key={option.id}><input type="radio" name={`${lab.id}-${q.id}`} checked={state.answers[q.id]===option.id} onChange={()=>onChange({...state,answers:{...state.answers,[q.id]:option.id}})}/>{option.label}</label>)}{state.answers[q.id]&&<div className="sim-feedback" aria-live="polite"><strong>{state.answers[q.id]===q.answer?"Correct":"Try again"}</strong><p>{q.explain}</p><Citations chunks={[q.chunk]}/></div>}</fieldset>)}
    </div><aside className="sim-visual">
    <div className="sim-water-visuals"><svg className="sim-scene" viewBox="0 0 560 280" role="img" aria-label={`${source.label}: supply ${current.supply}, need ${current.need}`}>
      <title>Supply and pond need</title><rect x="70" y="35" width="120" height="200" rx="15" fill="#e1e9de"/>
      <motion.rect x="75" width="110" rx="10" fill="#529ba4" animate={{y:235-current.supply/maximum*195,height:current.supply/maximum*195}} transition={{duration:reduced?0:.45}}/>
      <path d="M190 190H275V210" fill="none" stroke="#b4c5b5" strokeWidth="14"/><motion.circle cx="233" r="5" fill="#56b7d2" animate={reduced?{cy:190}:{cy:[184,197,184]}} transition={{duration:reduced?0:1.8,repeat:reduced?0:Infinity}}/>
      <rect x="280" y="95" width="230" height="140" rx="20" fill="#e1e9de"/><motion.rect x="286" width="218" rx="14" fill="#529ba4" animate={{y:235-Math.min(current.need,current.supply)/maximum*130,height:Math.min(current.need,current.supply)/maximum*130}} transition={{duration:reduced?0:.45}}/>
      <line x1="280" x2="510" y1={235-current.need/maximum*130} y2={235-current.need/maximum*130} stroke="#9b5114" strokeWidth="3" strokeDasharray="8 5"/>
      <text x="130" y="265" textAnchor="middle">Supply: {current.supply}</text><text x="395" y="265" textAnchor="middle">Need: {current.need}</text>
    </svg><svg className="sim-chart" viewBox="0 0 560 220" role="img" aria-label="Supply versus need across the year"><title>Supply versus need across the year</title>
      <line x1="40" x2="520" y1="170" y2="170" stroke="currentColor"/>{timeline.map(m=><line key={m.index} x1={40+m.index/(timeline.length-1)*480} x2={40+m.index/(timeline.length-1)*480} y1="30" y2="170" stroke={m.season==="dry"?"#edc082":"#acd5c1"} strokeWidth={state.month===m.index?8:2}/>)}
      <polyline points={timeline.map(m=>point(m.supply,m.index)).join(" ")} fill="none" stroke="#267d90" strokeWidth="4"/><polyline points={timeline.map(m=>point(m.need,m.index)).join(" ")} fill="none" stroke="#a76015" strokeWidth="3" strokeDasharray="6 5"/>
      <circle cx={40+state.month/(timeline.length-1)*480} cy={170-current.supply/maximum*135} r="6" fill="#267d90"/>
      <text x="40" y="200">Supply ━</text><text x="190" y="200">Need ┄</text><text x="330" y="200">{current.label}</text>
    </svg></div>
    <div className="sim-readout" aria-live="polite"><p>Supply: <strong>{current.supply}</strong> · Need: <strong>{current.need}</strong> {config.pondNeed.unit}</p>{current.shortfall>0?<p className="sim-shortfall" role="status">Shortfall: {current.shortfall} {config.pondNeed.unit}</p>:<p>Supply meets need in this example month.</p>}</div>
<p>{citationText(source.note)}</p><Citations chunks={source.chunks}/>
    </aside>
  </div>;
}
