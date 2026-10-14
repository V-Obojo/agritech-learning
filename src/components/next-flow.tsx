"use client";
import Link from "next/link";
import type { LearningContext } from "./learning-types";
import { resetProgress, updateProgress } from "@/lib/progress";
import { useTopicProgress } from "./use-progress";
import { recordEvent, resetMetrics } from "@/lib/metrics";
export function NextFlow({ topic }: { topic: LearningContext }) {
  const { progress, current, key, ready } = useTopicProgress(topic,`${topic.basePath}/next`);
  const intention=topic.intentions.find(intention => intention.id===progress.intention);
  const score=topic.config.understandingCheck.filter(question => current.checkAnswers[question.id]===question.answerIndex).length;
  const recommended=topic.config.nextSteps.find(step => step.id===current.activity?.feedback?.nextStep.id)
    ?? topic.config.nextSteps.find(step => step.id===(topic.config.defaultNextStep[progress.intention ?? ""] ?? topic.config.defaultNextStep.default))!;
  return <><section className="card"><h2>Your progress</h2><p>Intention: {intention?.label ?? "Not chosen yet"}</p><p>Understanding check: {score}/{topic.config.understandingCheck.length} correct</p>
    <p>Activity: {current.completed ? "Completed" : "Not completed yet"}</p><p>Guide questions asked: {current.guideQuestionsAsked}</p></section>
    <section className="card" aria-labelledby="session-title"><h2 id="session-title">Your session</h2><p>Completed activity: {current.completed ? "Yes" : "No"}</p><p>Check score: {score}/{topic.config.understandingCheck.length}</p><p>Would return: {progress.wouldReturn ?? "Not answered yet"}</p></section>
    <section className="card"><h2>Recommended next step</h2><p>{recommended.label}</p><h3>Other choices</h3><ul>{topic.config.nextSteps.filter(step => step.id!==recommended.id).map(step => <li key={step.id}>{step.label}</li>)}</ul></section>
    <section className="card"><h2>An optional reminder demo</h2><p><strong>Demo: reminders are not sent in this prototype</strong></p>
      <label className="choice"><input type="checkbox" disabled={!ready} checked={progress.reminderOptIn[key] ?? false} onChange={event => updateProgress({reminderOptIn:{...progress.reminderOptIn,[key]:event.target.checked}})} />{topic.config.reminder.label}</label>
      <div aria-live="polite">{progress.reminderOptIn[key] && <p className="hint">{topic.config.reminder.preview}</p>}</div></section>
    <fieldset disabled={!ready}><legend>Would you come back to learn the next topic?</legend>{(["yes","maybe","no"] as const).map(answer => <label className="choice" key={answer}>
      <input type="radio" name="would-return" checked={progress.wouldReturn===answer} onChange={() => {updateProgress({wouldReturn:answer});recordEvent("would_return",{topicId:topic.topicId,subjectId:topic.subjectId,answer});}} />{answer[0].toUpperCase()+answer.slice(1)}</label>)}</fieldset>
    <p>Pausing here is a fine choice. You can come back at your own pace.</p><div className="actions">
      <Link className="button" href={topic.hubPath}>Back to {topic.hubTitle} path</Link>
      {topic.nextTopic && <Link className="button secondary" href={topic.nextTopic.basePath}>Next topic: {topic.nextTopic.title}</Link>}
      <Link href={`${topic.basePath}/activity`}>Return to the activity</Link>
      <Link href={topic.homePath} onClick={() => {resetProgress();resetMetrics();}}>Start over</Link>
    </div>
  </>;
}
