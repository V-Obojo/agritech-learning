"use client";
import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import type { Pathway } from "@/lib/content/schemas";
import { loadProgress, updateProgress } from "@/lib/progress";
import { recordEvent } from "@/lib/metrics";
import { useProgress } from "./use-progress";
import { StuckHelp } from "./stuck-help";
import { GuidePanel } from "./guide-panel";
export function LessonFlow({ pathway, children }: { pathway: Pathway; children: ReactNode }) {
  const { progress, ready } = useProgress();
  useEffect(() => {
    if (ready && !loadProgress().lessonViewed) {
      updateProgress({ lessonViewed: true });
      recordEvent("lesson_viewed");
    }
  }, [ready, progress.lessonViewed]);
  const welcome = pathway.intentions.find((intention) => intention.id === progress.intention)?.welcome;
  return <>{welcome && <p>{welcome}</p>}<StuckHelp step="lesson" />{children}
    <section className="card" aria-labelledby="check-title"><h2 id="check-title">Check your understanding</h2><p>This is practice. You can try each question again.</p>
      {pathway.understandingCheck.map((question) => {
        const answer = progress.checkAnswers[question.id];
        return <fieldset key={question.id} disabled={!ready}><legend>{question.question}</legend>
          {question.options.map((option, index) => <label className="choice" key={index}>
            <input type="radio" name={question.id} checked={answer === index}
              onChange={() => { updateProgress({ checkAnswers: { ...progress.checkAnswers, [question.id]: index } }); recordEvent("check_answered", { questionId: question.id, answerIndex: index, correct: index === question.answerIndex }); }} />{option}</label>)}
          <div aria-live="polite">{answer !== undefined && <p>{answer === question.answerIndex ? "That’s right." : `Try again. The answer is: ${question.options[question.answerIndex]}.`} <a href={`#${question.chunk}`}>Revisit {question.chunk}</a></p>}</div>
        </fieldset>;
      })}
    </section><GuidePanel /><div className="actions"><Link className="button" href="/activity">Try the activity</Link><Link href="/">Back to welcome</Link></div>
  </>;
}
