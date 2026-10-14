"use client";
import { useEffect, useRef } from "react";
import { recordEvent } from "@/lib/metrics";
export function NavigationEvent({name,areaId,subjectId,topicId}: {name:"area_opened"|"subject_opened"|"topic_opened";areaId:string;subjectId?:string;topicId?:string}) {
  const recorded=useRef<string|null>(null);
  useEffect(()=>{
    const signature=JSON.stringify([name,areaId,subjectId,topicId]);
    if(recorded.current===signature) return;
    recorded.current=signature;
    recordEvent(name,{areaId,...(subjectId ? {subjectId} : {}),...(topicId ? {topicId} : {})});
  },[name,areaId,subjectId,topicId]);
  return null;
}
