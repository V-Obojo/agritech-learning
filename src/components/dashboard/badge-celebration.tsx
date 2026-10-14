"use client";
import { useEffect,useState } from "react";
import { AnimatePresence,motion,useReducedMotion } from "motion/react";
import { getEvents,subscribeMetrics } from "@/lib/metrics";
import { loadProgress,subscribeProgress,updateProgress } from "@/lib/progress";
import { computeBadges,type BadgeDefinition,type InsightTopic } from "@/lib/insights/calculators";
import "./celebration.css";
export function BadgeCelebration({badges,topics}:{badges:{badges:BadgeDefinition[]};topics:InsightTopic[]}) {
  const [toasts,setToasts]=useState<{id:string;label:string;emoji:string}[]>([]),reduced=useReducedMotion();
  useEffect(()=>{
    const timers=new Set<ReturnType<typeof setTimeout>>();
    function celebrate() {
      const progress=loadProgress(),earned=computeBadges(badges,progress,getEvents(),topics,new Date()).filter(b=>b.earned&&!progress.celebratedBadges[b.id]);
      if(!earned.length) return;
      updateProgress({celebratedBadges:{...progress.celebratedBadges,...Object.fromEntries(earned.map(b=>[b.id,b.earnedAt!]))}});
      setToasts(current=>[...current,...earned]);
      const timer=setTimeout(()=>{setToasts(current=>current.filter(t=>!earned.some(b=>b.id===t.id)));timers.delete(timer);},8000);timers.add(timer);
    }
    let pending:ReturnType<typeof setTimeout>|undefined;
    function schedule() {if(pending) clearTimeout(pending);pending=setTimeout(()=>{timers.delete(pending!);pending=undefined;celebrate();},0);timers.add(pending);}
    const unsubscribe=subscribeProgress(schedule),unsubscribeEvents=subscribeMetrics(schedule);
    schedule();
    return ()=>{unsubscribe();unsubscribeEvents();timers.forEach(clearTimeout);};
  },[badges,topics]);
  return <div className="ov-badge-toasts" aria-live="polite" aria-atomic="false"><AnimatePresence>{toasts.map(t=><motion.div className="ov-badge-toast" key={t.id} role="status" initial={reduced ? false : {opacity:0,y:20,scale:.95}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0}} transition={{duration:reduced ? 0 : .2}}><span aria-hidden="true">{t.emoji}</span><strong>Badge earned: {t.label}</strong><button className="secondary" aria-label={`Dismiss ${t.label} badge`} onClick={()=>setToasts(current=>current.filter(item=>item.id!==t.id))}>×</button></motion.div>)}</AnimatePresence></div>;
}
