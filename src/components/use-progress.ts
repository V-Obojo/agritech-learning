"use client";
import { useSyncExternalStore } from "react";
import { loadProgress, serverProgress, subscribeProgress } from "@/lib/progress";
const emptySubscribe = () => () => {};
export function useProgress() {
  const progress = useSyncExternalStore(subscribeProgress, loadProgress, () => serverProgress);
  const ready = useSyncExternalStore(emptySubscribe, () => true, () => false);
  return { progress, ready };
}
