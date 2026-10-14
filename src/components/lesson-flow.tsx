"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import type { LearningContext } from "./learning-types";
import { updateTopicProgress } from "@/lib/progress";
import { recordEvent } from "@/lib/metrics";
import { useTopicProgress } from "./use-progress";
import { StuckHelp } from "./stuck-help";
import { GuidePanel } from "./guide-panel";
export function LessonFlow({ topic, children }: { topic: LearningContext; children: ReactNode }) {
  const { progress, current, key, ready } = useTopicProgress(topic,topic.basePath,true);
  const welcome = topic.config.welcome[progress.intention ?? ""];
  return <>{welcome && <p>{welcome}</p>}<StuckHelp step="lesson" topic={topic} />{children}
    <section className="card" aria-labelledby="check-title"><h2 id="check-title">Check your understanding</h2><p>This is practice. You can try each question again.</p>
      {topic.config.understandingCheck.map(question => {
        const answer=current.checkAnswers[question.id];
        return <fieldset key={question.id} disabled={!ready}><legend>{question.question}</legend>
          {question.options.map((option,index) => <label className="choice" key={index}>
            <input type="radio" name={`${topic.subjectId}-${topic.topicId}-${question.id}`} checked={answer===index} onChange={() => {
              updateTopicProgress(key,{checkAnswers:{...current.checkAnswers,[question.id]:index}});
              recordEvent("check_answered",{topicId:topic.topicId,subjectId:topic.subjectId,questionId:question.id,answerIndex:index,correct:index===question.answerIndex});
            }} />{option}</label>)}
          <div aria-live="polite">{answer!==undefined && <p>{answer===question.answerIndex ? "That’s right." : `Try again. The answer is: ${question.options[question.answerIndex]}.`} <a href={`#${question.chunk}`}>Revisit {question.chunk}</a></p>}</div>
        </fieldset>;
      })}
    </section><GuidePanel topic={topic} /><div className="actions"><Link className="button" href={`${topic.basePath}/activity`}>Try the activity</Link><Link href={topic.hubPath}>Back to {topic.hubTitle} path</Link></div>
  </>;
}
