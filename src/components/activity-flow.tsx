"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import type { Activity } from "@/lib/content/schemas";
import { feedbackResponseSchema, type FeedbackEntry } from "@/lib/feedback/types";
import { updateProgress, type Progress } from "@/lib/progress";
import { useProgress } from "./use-progress";
import { postJson } from "./api-client";
import { StuckHelp } from "./stuck-help";
import { recordEvent } from "@/lib/metrics";
function Entry({ entry }: { entry: FeedbackEntry }) {
  return <div><p>{entry.message}</p><div className="chips">{entry.chunkIds.map((id) => <Link className="chip" key={id} href={`/lesson#${id}`}>Revisit {id}</Link>)}</div></div>;
}
export function ActivityFlow({ activity }: { activity: Activity }) {
  const { progress, ready } = useProgress();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pathId = progress.activity?.pathId ?? "fictional";
  const response = progress.activity?.response ?? "";
  const feedback = progress.activity?.feedback;
  const path = activity.paths.find((path) => path.id === pathId)!;
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    recordEvent("activity_submitted", { pathId });
    try {
      const result = await postJson("/api/feedback", { pathId, response, intention: progress.intention ?? undefined }, feedbackResponseSchema);
      updateProgress({ activity: { pathId, response, feedback: result } });
      if (result.completed) recordEvent("activity_completed", { pathId });
    } catch { setError("Feedback could not load. Your answer is saved; please try again."); }
    finally { setBusy(false); }
  }
  return <><p>{activity.intro}</p><fieldset disabled={!ready || busy}><legend>Choose your activity path</legend>
    {activity.paths.map((option) => <label className="choice" key={option.id}><input type="radio" name="path" checked={pathId === option.id}
      onChange={() => { setError(""); updateProgress({ activity: { pathId: option.id as NonNullable<Progress["activity"]>["pathId"], response: "", feedback: null } }); }} />{option.label}</label>)}
    </fieldset><section className="card"><h2>{path.label}</h2><p>{path.prompt}</p>{path.scenario && <div className="hint"><h3>Amina’s story (fictional)</h3><p>{path.scenario}</p></div>}
      {path.example && <details key={`example-${pathId}`}><summary>See an example</summary><p>{path.example}</p></details>}
      <form onSubmit={submit}><label htmlFor="activity-response">Your answer</label><textarea id="activity-response" required maxLength={2000} disabled={!ready || busy} value={response}
        onChange={(event) => updateProgress({ activity: { pathId, response: event.target.value, feedback: null } })} />
        <p className="eyebrow">{response.length}/2000 characters · Your draft is saved on this device.</p>
        <button disabled={!ready || busy || !response.trim()}>{busy ? "Getting feedback…" : "Get feedback"}</button>
      </form><StuckHelp key={`help-${pathId}`} step={`activity-${pathId}`} /></section>
    <div aria-live="polite" aria-busy={busy}>{error && <p role="alert">{error}</p>}{feedback && <section className="card" aria-labelledby="feedback-title"><h2 id="feedback-title">{feedback.completed ? "Activity completed" : "Let’s try a little more"}</h2>
      {feedback.hint && <p className="hint">{feedback.hint}</p>}
      {feedback.completed && <><h3>Something you did well</h3>{feedback.strengths.map((entry) => <Entry key={entry.criterionId} entry={entry} />)}<h3>Things to consider</h3>{feedback.toConsider.map((entry, index) => <Entry key={index} entry={entry} />)}</>}
      <p><strong>Next step:</strong> {feedback.nextStep.label}</p>
      {feedback.mode !== "live" && <p className="eyebrow">{feedback.mode === "mock" ? "Demo feedback · based on the authored rubric" : "Demo fallback · live feedback is unavailable"}</p>}
    </section>}</div><div className="actions">{feedback?.completed && <Link className="button" href="/next">See my next steps</Link>}<Link href="/lesson">Back to lesson</Link><Link href="/next">Pause and see next steps</Link></div>
  </>;
}
