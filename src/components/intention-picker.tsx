"use client";
import type { Catalog } from "@/lib/content/schemas";
import { updateProgress } from "@/lib/progress";
import { useProgress } from "./use-progress";
import { recordEvent } from "@/lib/metrics";
export function IntentionPicker({ intentions, name = "intention", legend = "What brings you here?" }: { intentions: Catalog["intentions"]; name?: string; legend?: string }) {
  const {progress,ready}=useProgress();
  return <fieldset className="intention-picker" disabled={!ready}><legend>{legend}</legend>{intentions.map(intention => <label className="choice" key={intention.id}>
    <input type="radio" name={name} checked={progress.intention===intention.id} onChange={() => {updateProgress({intention:intention.id});recordEvent("intention_chosen",{intention:intention.id});}} />{intention.label}
  </label>)}</fieldset>;
}
