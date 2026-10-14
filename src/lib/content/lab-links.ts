import "server-only";
import {getCatalog,getMedia,getSubjectPath,getTopic} from "./index";
import {parseBlocks} from "./parse-lesson";
import type {Lab} from "./media-labs";
export function labLink(lab:Lab) {
  const area=getCatalog().areas.find(a=>a.subjects.some(s=>s.id===lab.subjectId))!;
  const subject=area.subjects.find(s=>s.id===lab.subjectId)!;
  const meta=getSubjectPath(subject.id).topics.find(t=>t.id===lab.topicId)!;
  const topic=getTopic(subject.id,meta.id);
  const chunk=topic.lesson.chunks.find(c=>parseBlocks(c.body).some(b=>b.type==="lab"&&b.labId===lab.id));
  if(!chunk) throw new Error(`Lab ${lab.id} is not embedded in its lesson`);
  return {url:`/${area.slug}/${subject.slug}/${meta.slug}#${chunk.id}`,topicTitle:meta.title};
}
export function labFallback(lab:Lab) {
  if(lab.type!=="model-viewer") return undefined;
  const topic=getTopic(lab.subjectId,lab.topicId);
  const bodyChunk=lab.hotspots.find(h=>h.part==="body")?.chunk;
  const figure=topic.lesson.chunks.find(c=>c.id===bodyChunk)?.blocks?.find(b=>b.type==="figure");
  return figure?.type==="figure"?getMedia(figure.mediaId):undefined;
}
