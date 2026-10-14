"use client";
import { useEffect, useSyncExternalStore } from "react";
import { getTopicProgress, loadProgress, serverProgress, subscribeProgress, topicKey, visitTopic } from "@/lib/progress";
import { useAccount } from "./account-provider";
import { recordEvent } from "@/lib/metrics";
const emptySubscribe = () => () => {};
export function useProgress() {
  const {initialProgress,user}=useAccount();
  const progress = useSyncExternalStore(subscribeProgress, loadProgress, () => initialProgress ?? serverProgress);
  const ready = useSyncExternalStore(emptySubscribe, () => true, () => false);
  return { progress, ready: Boolean(user) || ready };
}
export function useTopicProgress(topic: { subjectId: string; topicId: string }, path: string, viewed = false) {
  const { progress, ready } = useProgress();
  const key = topicKey(topic.subjectId, topic.topicId);
  const current = getTopicProgress(progress, key);
  // Saved-state updates, including reset, are not new page visits.
  useEffect(() => {
    if (!ready) return;
    const latest = loadProgress();
    const firstView = viewed && !getTopicProgress(latest,key).viewed;
    if (latest.lastPath !== path || firstView) visitTopic(key,path,viewed);
    if (firstView) recordEvent("lesson_viewed", { topicId: topic.topicId, subjectId: topic.subjectId });
  }, [ready, key, path, viewed, topic.topicId, topic.subjectId]);
  return { progress, current, key, ready };
}
