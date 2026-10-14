"use client";
import {useEffect,useState} from "react";
import Image from "next/image";
import {animate,motion,useMotionValue,useTransform} from "motion/react";
import {useLabReducedMotion} from "./use-lab-reduced-motion";
import type {Lab,Media} from "@/lib/content/media-labs";
import {Credit} from "../media/figure";
export type SimulationProps={lab:Lab;data:unknown;media:Record<string,Media>;ready:boolean;onChange:(data:unknown)=>void};
export function Citations({chunks}:{chunks:string[]}) {return <div className="sim-citations">{[...new Set(chunks)].map(id=><a className="chip" key={id} href={`#${id}`}>{id}</a>)}</div>;}
export function InlineCitations({text}:{text:string}) {const ids=[...new Set(text.match(/\b[a-z]+-\d+\b/g)??[])];return <Citations chunks={ids}/>;}
export function LabPhoto({media}:{media:Media}) {return <figure className="sim-photo"><Image src={media.file} width={media.width} height={media.height} alt={media.alt} sizes="(max-width: 767px) 100vw, 500px"/><figcaption>{media.caption}<Credit media={media}/></figcaption></figure>;}
export function NumericInput({label,value,min,max,step,disabled,onChange}:{label:string;value:number;min:number;max:number;step:number;disabled:boolean;onChange:(value:number)=>void}) {
  const [editing,setEditing]=useState(false),[draft,setDraft]=useState("");
  return <label className="sim-number">{label}<input aria-label={label} type="number" min={min} max={max} step={step} disabled={disabled} value={editing?draft:String(value)} onFocus={()=>{setDraft(String(value));setEditing(true);}} onChange={e=>{setDraft(e.target.value);if(e.target.value!==""&&Number.isFinite(e.target.valueAsNumber))onChange(e.target.valueAsNumber);}} onBlur={()=>{setEditing(false);if(draft!==""&&Number.isFinite(Number(draft)))onChange(Number(draft));}}/></label>;
}
export function AnimatedNumber({value}:{value:number}) {
  const reduced=useLabReducedMotion(),number=useMotionValue(value),display=useTransform(number,n=>new Intl.NumberFormat("en-NG",{maximumFractionDigits:2}).format(n));
  useEffect(()=>{const control=animate(number,value,{duration:reduced?0:.25});return ()=>control.stop();},[number,reduced,value]);
  return <motion.span data-value={value}>{display}</motion.span>;
}
