"use client";
import { useState, type FormEvent } from "react";
import { Reveal } from "./motion-surface";
import Link from "next/link";
import type { Activity } from "@/lib/content/schemas";
import { feedbackResponseSchema, type FeedbackEntry } from "@/lib/feedback/types";
import { updateTopicProgress } from "@/lib/progress";
import type { LearningContext } from "./learning-types";
import { useTopicProgress } from "./use-progress";
import { postJson } from "./api-client";
import { StuckHelp } from "./stuck-help";
import { recordEvent } from "@/lib/metrics";
function Entry({ entry, basePath }: { entry: FeedbackEntry; basePath: string }) {
  return <div><p>{entry.message}</p><div className="chips">{entry.chunkIds.map((id) => <Link className="chip" key={id} href={`${basePath}#${id}`}>Revisit {id}</Link>)}</div></div>;
}
export function ActivityFlow({ activity, topic }: { activity: Activity; topic: LearningContext }) {
  const { progress, current, key, ready } = useTopicProgress(topic, `${topic.basePath}/activity`);
  const responseId = `${topic.subjectId}-${topic.topicId}-activity-response`;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const path = activity.paths.find(path => path.id === current.activity?.pathId) ?? activity.paths[0];
  const pathId = path.id;
  const response = current.activity?.response ?? "";
  const feedback = current.activity?.feedback;
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    recordEvent("activity_submitted", { topicId: topic.topicId, subjectId: topic.subjectId, pathId });
    try {
      const result = await postJson("/api/feedback", { topicId: topic.topicId, subjectId: topic.subjectId, pathId, response, intention: progress.intention ?? undefined }, feedbackResponseSchema);
      updateTopicProgress(key, { activity: { pathId, response, feedback: result }, completed: current.completed || result.completed });
      if (result.completed) recordEvent("activity_completed", { topicId: topic.topicId, subjectId: topic.subjectId, pathId });
    } catch { setError("Feedback could not load. Your answer is saved; please try again."); }
    finally { setBusy(false); }
  }
  return <div className="activity-layout"><p className="activity-intro lead">{activity.intro}</p><fieldset disabled={!ready || busy}><legend>Choose your activity path</legend>
    {activity.paths.map((option) => <label className="choice" key={option.id}><input type="radio" name={`${topic.subjectId}-${topic.topicId}-path`} checked={pathId === option.id}
      onChange={() => { setError(""); updateTopicProgress(key, { activity: { pathId: option.id, response: "", feedback: null } }); }} />{option.label}</label>)}
    </fieldset><section className="card"><h2>{path.label}</h2><p>{path.prompt}</p>{path.scenario && <div className="hint"><h3>{path.label}</h3><p>{path.scenario}</p></div>}
      {path.example && <details key={`example-${pathId}`}><summary>See an example</summary><p>{path.example}</p></details>}
      <form onSubmit={submit}><label htmlFor={responseId}>Your answer</label><textarea id={responseId} required maxLength={2000} disabled={!ready || busy} value={response}
        onChange={(event) => updateTopicProgress(key, { activity: { pathId, response: event.target.value, feedback: null } })} />
        <p className="eyebrow">{response.length}/2000 characters · Your answer is saved on this device.</p>
        <button disabled={!ready || busy || !response.trim()}>{busy ? "Getting feedback…" : "Get feedback"}</button>
      </form><StuckHelp key={`help-${pathId}`} step={`activity-${pathId}`} topic={topic} /></section>
    <div className="activity-feedback" aria-live="polite" aria-busy={busy}>{error && <p role="alert">{error}</p>}{feedback && <Reveal><section className="card" aria-labelledby="feedback-title"><h2 id="feedback-title">{feedback.completed ? "Activity completed" : "Let’s try a little more"}</h2>
      {feedback.hint && <p className="hint">{feedback.hint}</p>}
      {feedback.completed && <><h3>Something you did well</h3>{feedback.strengths.map((entry) => <Entry key={entry.criterionId} entry={entry} basePath={topic.basePath} />)}<h3>Things to consider</h3>{feedback.toConsider.map((entry, index) => <Entry key={index} entry={entry} basePath={topic.basePath} />)}</>}
      <p><strong>Next step:</strong> {feedback.nextStep.label}</p>
      {feedback.mode !== "live" && <p className="eyebrow">{feedback.mode === "mock" ? "Demo feedback · based on the authored rubric" : "Demo fallback · live feedback is unavailable"}</p>}
    </section></Reveal>}</div><div className="actions">{feedback?.completed && <Link className="button" href={`${topic.basePath}/next`}>See my next steps</Link>}<Link href={topic.basePath}>Back to lesson</Link><Link href={`${topic.basePath}/next`}>Pause and see next steps</Link></div>
  </div>;
}
