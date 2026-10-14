"use client";
import { signOut } from "next-auth/react";
import { configureProgressAccount,flushAccountProgress,progressSchema,resetProgress,type Progress } from "@/lib/progress";
import { configureMetricsAccount,flushAccountEvents,resetMetrics,type MetricEvent } from "@/lib/metrics";

export async function mergeGuestAccount(guest:Progress,events:MetricEvent[]) {
  const response=await fetch("/api/me/progress",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({progress:guest,merge:true})});
  if(!response.ok) throw new Error("Your account is signed in, but your progress could not sync. Please try again.");
  progressSchema.parse(await response.json());
  for(let index=0;index<events.length;index+=200) {
    const saved=await fetch("/api/me/events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({events:events.slice(index,index+200)})});
    if(!saved.ok) throw new Error("Your learning history could not sync. Please try again.");
  }
  resetProgress();resetMetrics();
}
export async function leaveAccount(deleted=false) {
  if(!deleted) await Promise.all([flushAccountProgress(),flushAccountEvents()]);
  await signOut({redirect:false});
  configureProgressAccount(null);configureMetricsAccount(null);
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Discard cached authenticated React state at the session boundary.
  window.location.assign("/");
}
