"use client";
import { useState, type FormEvent } from "react";
import { guideResponseSchema, type GuideResponse } from "@/lib/guide/types";
import { getTopicProgress, topicKey, updateTopicProgress } from "@/lib/progress";
import { postJson } from "./api-client";
import { StuckHelp } from "./stuck-help";
import type { LearningContext } from "./learning-types";
import { useProgress } from "./use-progress";
import { useAccount } from "./account-provider";
import { recordEvent } from "@/lib/metrics";
export function GuidePanel({ topic, onCitation }: { topic: LearningContext; onCitation?:()=>void }) {
  const {progress}=useProgress();
  const {user}=useAccount();
  const [historyError,setHistoryError]=useState("");
  const questionId = `${topic.subjectId}-${topic.topicId}-guide-question`;
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<GuideResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function ask(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(""); setAnswer(null);
    recordEvent("guide_asked", { topicId: topic.topicId, subjectId: topic.subjectId });
    try {
      const result = await postJson("/api/guide", { topicId: topic.topicId, subjectId: topic.subjectId, question, ...(progress.intention ? { intention: progress.intention } : {}) }, guideResponseSchema);
      setAnswer(result); updateTopicProgress(topicKey(topic.subjectId, topic.topicId), { guideQuestionsAsked: getTopicProgress(progress, topicKey(topic.subjectId, topic.topicId)).guideQuestionsAsked + 1 });
      if(user) {
        try {const saved=await fetch("/api/me/guide-history",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subjectId:topic.subjectId,topicId:topic.topicId,question,answer:result.answer,supported:result.supported,citations:result.citations.map(({chunkId,title})=>({chunkId,title}))})});if(!saved.ok) throw new Error();setHistoryError("");}
        catch {setHistoryError("This answer is available, but could not save to your account history.");}
      }
      if (!result.supported) recordEvent("guide_unsupported", { topicId: topic.topicId, subjectId: topic.subjectId });
    } catch { setError("The guide could not answer just now. Please try again."); }
    finally { setBusy(false); }
  }
  return <section className="card" aria-labelledby="guide-title"><h2 id="guide-title">Ask the learning guide</h2><p>Ask about one idea from the lesson.</p>
    <details><summary>Suggested questions</summary><div className="actions">{topic.config.starterQuestions.map((starter) => <button type="button" className="secondary" disabled={busy} key={starter} onClick={() => setQuestion(starter)}>{starter}</button>)}</div></details>
    <form onSubmit={ask}><label htmlFor={questionId}>Your question</label><textarea id={questionId} value={question} maxLength={500} required disabled={busy} onChange={(event) => setQuestion(event.target.value)} />
      <button disabled={busy || !question.trim()}>{busy ? "Thinking…" : error ? "Retry guide" : "Ask guide"}</button></form>
    {historyError && <p role="status">{historyError}</p>}<div aria-live="polite" aria-busy={busy}>{error && <p role="alert">{error}</p>}{answer && <div className={answer.supported ? "answer-card" : "not-covered"}>
      <h3>{answer.supported ? "From the lesson" : "Not covered in this lesson"}</h3><p className="answer">{answer.answer}</p>
      <div className="chips">{answer.citations.map((citation) => <a className="chip" key={citation.chunkId} href={`#${citation.chunkId}`} onClick={onCitation}>{citation.chunkId} · {citation.title}</a>)}</div>
      <p><strong>Next step:</strong> {answer.nextStep.label}</p>
      {answer.mode !== "live" && <p className="eyebrow">{answer.mode === "mock" ? "Demo guide · answers from lesson excerpts" : "Demo fallback · the live guide is unavailable"}</p>}
    </div>}</div><StuckHelp step="guide" topic={topic} label="Help asking the guide" />
  </section>;
}
