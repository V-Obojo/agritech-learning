"use client";
import Link from "next/link";
import type { Pathway } from "@/lib/content/schemas";
import { resetProgress, updateProgress } from "@/lib/progress";
import { useProgress } from "./use-progress";
import { recordEvent, resetMetrics } from "@/lib/metrics";
export function NextFlow({ pathway }: { pathway: Pathway }) {
  const { progress, ready } = useProgress();
  const intention = pathway.intentions.find((intention) => intention.id === progress.intention);
  const score = pathway.understandingCheck.filter((question) => progress.checkAnswers[question.id] === question.answerIndex).length;
  const recommended = pathway.nextSteps.find((step) => step.id === progress.activity?.feedback?.nextStep.id)
    ?? pathway.nextSteps.find((step) => step.id === (progress.intention === "considering" ? "dry-season-check" : "talk-farmer"))!;
  return <><section className="card"><h2>Your progress</h2><p>Intention: {intention?.label ?? "Not chosen yet"}</p><p>Understanding check: {score}/{pathway.understandingCheck.length} correct</p>
    <p>Activity: {progress.activity?.feedback?.completed ? "Completed" : "Not completed yet"}</p><p>Guide questions asked: {progress.guideQuestionsAsked}</p></section>
    <section className="card" aria-labelledby="session-title"><h2 id="session-title">Your session</h2>
      <p>Completed activity: {progress.activity?.feedback?.completed ? "Yes" : "No"}</p>
      <p>Check score: {score}/{pathway.understandingCheck.length}</p>
      <p>Would return: {progress.wouldReturn ?? "Not answered yet"}</p>
    </section>
    <section className="card"><h2>Recommended next step</h2><p>{recommended.label}</p><h3>Other choices</h3><ul>{pathway.nextSteps.filter((step) => step.id !== recommended.id).map((step) => <li key={step.id}>{step.label}</li>)}</ul></section>
    <section className="card"><h2>An optional reminder demo</h2><p><strong>Demo: reminders are not sent in this prototype</strong></p>
      <label className="choice"><input type="checkbox" disabled={!ready} checked={progress.reminderOptIn} onChange={(event) => updateProgress({ reminderOptIn: event.target.checked })} />{pathway.reminder.label}</label>
      <div aria-live="polite">{progress.reminderOptIn && <p className="hint">{pathway.reminder.preview}</p>}</div></section>
    <fieldset disabled={!ready}><legend>Would you come back to learn the next topic?</legend>{(["yes", "maybe", "no"] as const).map((answer) => <label className="choice" key={answer}>
      <input type="radio" name="would-return" checked={progress.wouldReturn === answer} onChange={() => { updateProgress({ wouldReturn: answer }); recordEvent("would_return", { answer }); }} />{answer[0].toUpperCase() + answer.slice(1)}</label>)}</fieldset>
    <p>Pausing here is a fine choice. You can come back at your own pace.</p><div className="actions"><Link className="button" href="/activity">Return to the activity</Link><Link href="/" onClick={() => { resetProgress(); resetMetrics(); }}>Start over</Link></div>
  </>;
}
