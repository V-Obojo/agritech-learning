"use client";
import type { Catalog } from "@/lib/content/schemas";
import { updateProgress } from "@/lib/progress";
import { useProgress } from "./use-progress";
import { recordEvent } from "@/lib/metrics";
export function IntentionPicker({ intentions, name = "intention" }: { intentions: Catalog["intentions"]; name?: string }) {
  const {progress,ready}=useProgress();
  return <fieldset disabled={!ready}><legend>What brings you here?</legend>{intentions.map(intention => <label className="choice" key={intention.id}>
    <input type="radio" name={name} checked={progress.intention===intention.id} onChange={() => {updateProgress({intention:intention.id});recordEvent("intention_chosen",{intention:intention.id});}} />{intention.label}
  </label>)}</fieldset>;
}
