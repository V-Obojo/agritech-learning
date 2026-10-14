import { getLesson, getPathway, getSources } from "@/lib/content";
import { DraftBanner } from "@/components/draft-banner";
import { LessonFlow } from "@/components/lesson-flow";
function Body({ body }: { body: string }) {
  return body.split(/\n\n+/).map((block, index) => {
    const lines = block.split("\n");
    const bulletStart = lines.findIndex((line) => line.startsWith("- "));
    return <div key={index}>{bulletStart < 0 ? <p>{block}</p> : <>
      {bulletStart > 0 && <p>{lines.slice(0, bulletStart).join(" ")}</p>}
      <ul>{lines.slice(bulletStart).map((line, item) => <li key={item}>{line.replace(/^- /, "")}</li>)}</ul>
    </>}</div>;
  });
}
export default function LessonPage() {
  const lesson = getLesson();
  const sources = getSources().sources;
  return <main id="main"><p className="eyebrow">Step 1 · Learn the basics · About {lesson.estimated_minutes} minutes</p>
    <h1>{lesson.title}</h1><DraftBanner note={lesson.review_note} />
    <LessonFlow pathway={getPathway()}>
      {lesson.chunks.map((chunk) => <section className="lesson-chunk" id={chunk.id} key={chunk.id} aria-labelledby={`${chunk.id}-title`}>
        <p className="eyebrow">{chunk.id}</p><h2 id={`${chunk.id}-title`}>{chunk.title}</h2><Body body={chunk.body} />
        <details><summary>Sources</summary><ul>{chunk.sourceIds.map((id) => {
          const source = sources.find((source) => source.id === id)!;
          return <li key={id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a><p>{source.publisher} · {source.year}</p></li>;
        })}</ul></details>
      </section>)}
    </LessonFlow>
  </main>;
}
