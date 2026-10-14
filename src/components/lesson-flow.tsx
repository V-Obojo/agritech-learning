"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import type { LearningContext } from "./learning-types";
import { updateTopicProgress } from "@/lib/progress";
import { recordEvent } from "@/lib/metrics";
import { useTopicProgress } from "./use-progress";
import { LessonContents, LessonGuide } from "./lesson-tools";
import { Reveal } from "./motion-surface";
export function LessonFlow({ topic, children, chunks }: { topic: LearningContext; children: ReactNode; chunks:{id:string;title:string}[] }) {
  const { progress, current, key, ready } = useTopicProgress(topic,topic.basePath,true);
  const welcome = topic.config.welcome[progress.intention ?? ""];
  return <div className="lesson-layout"><LessonContents chunks={chunks} /><article className="lesson-reading">{welcome && <p className="hint">{welcome}</p>}{children}
    <section className="card" aria-labelledby="check-title"><h2 id="check-title">Check your understanding</h2><p>This is practice. You can try each question again.</p>
      {topic.config.understandingCheck.map(question => {
        const answer=current.checkAnswers[question.id];
        return <fieldset key={question.id} disabled={!ready}><legend>{question.question}</legend>
          {question.options.map((option,index) => <label className="choice" key={index}>
            <input type="radio" name={`${topic.subjectId}-${topic.topicId}-${question.id}`} checked={answer===index} onChange={() => {
              updateTopicProgress(key,{checkAnswers:{...current.checkAnswers,[question.id]:index}});
              recordEvent("check_answered",{topicId:topic.topicId,subjectId:topic.subjectId,questionId:question.id,answerIndex:index,correct:index===question.answerIndex});
            }} />{option}</label>)}
          <div aria-live="polite">{answer!==undefined && <Reveal key={answer}><p className="check-feedback">{answer===question.answerIndex ? "That’s right." : `Try again. The answer is: ${question.options[question.answerIndex]}.`} <a href={`#${question.chunk}`}>Revisit {question.chunk}</a></p></Reveal>}</div>
        </fieldset>;
      })}
    </section><div className="actions"><Link className="button" href={`${topic.basePath}/activity`}>Try the activity</Link><Link href={topic.hubPath}>Back to {topic.hubTitle} path</Link></div></article><LessonGuide topic={topic} />
  </div>;
}
