"use client";
import Link from "next/link";
import type {Lab} from "@/lib/content/media-labs";
import {Reveal} from "../motion-surface";
import {useProgress} from "../use-progress";
import "./labs.css";
function Teaser({type}:{type:Lab["type"]}) {
  if(type==="model-viewer")return <svg viewBox="0 0 180 80" data-preview={type}><path d="M25 35Q65 10 140 34L165 18Q175 40 165 62L140 46Q60 68 25 45Z" fill="#c9ccad"/><path d="M25 38Q10 25 3 30M25 43Q10 60 3 55M40 33L35 15M55 32Q90 4 140 34" stroke="#e8c879" fill="none" strokeWidth="2"/><circle cx="35" cy="35" r="3" fill="#08252e"/></svg>;
  if(type==="water-simulator")return <svg viewBox="0 0 180 80" data-preview={type}><rect x="15" y="8" width="35" height="64" rx="7" fill="#cfdfcf"/><rect className="preview-water" x="18" y="15" width="29" height="55" fill="#66b3ca"/><path d="M50 55H75V65" stroke="#cfdfcf" strokeWidth="7" fill="none"/><ellipse cx="120" cy="60" rx="44" ry="14" fill="#66b3ca"/><path d="M90 40L110 24L130 32L153 16" stroke="#e8c879" strokeWidth="3" fill="none"/></svg>;
  if(type==="pond-builder")return <svg viewBox="0 0 180 80" data-preview={type}><rect x="25" y="18" width="126" height="46" rx="5" fill="#66b3ca" stroke="#c5b177" strokeWidth="5"/><path d="M20 10H155M16 14V68" stroke="#e8c879" strokeWidth="3"/><path d="M25 6V14M55 6V14M85 6V14M115 6V14M145 6V14" stroke="#e8c879" strokeWidth="2"/><circle cx="150" cy="64" r="7" fill="#e8c879"/></svg>;
  return <svg viewBox="0 0 180 80" data-preview={type}><ellipse cx="90" cy="48" rx="70" ry="28" fill="#548e8a"/><path d="M58 43Q72 16 85 43" fill="#c9ccad"/><circle cx="95" cy="24" r="5" fill="none" stroke="#cfebe0" strokeWidth="2"/><circle cx="110" cy="14" r="3" fill="#cfebe0"/><path d="M130 26L141 45H119Z" fill="#e8c879"/><path d="M130 32V38M130 41V43" stroke="#092f3b" strokeWidth="2"/></svg>;
}
export function LabGallery({items}:{items:{lab:Lab;url:string;topicTitle:string}[]}) {
  const {progress}=useProgress();
  return <div className="labs-grid">{items.map(({lab,url,topicTitle})=><Reveal key={lab.id}><article className="labs-card" data-lab-card={lab.id}>
    <div className="lab-teaser" aria-hidden="true"><Teaser type={lab.type}/></div>
    <p className="eyebrow">{topicTitle}</p><h2>{lab.title}</h2><p>{lab.teaser}</p><p>{progress.labs[lab.id]?.completed?"Completed ✓":progress.labs[lab.id]?"In progress":"Ready to explore"}</p><Link className="button" href={url} prefetch={false}>Open in lesson</Link>
  </article></Reveal>)}</div>;
}
