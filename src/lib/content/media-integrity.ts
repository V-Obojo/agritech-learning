import "server-only";
import {existsSync} from "node:fs";
import {join} from "node:path";
import {getBadges,getTopic,listLabs,listLiveTopics,listMedia} from "./index";
import {parseBlocks} from "./parse-lesson";
import type {Lab,Media} from "./media-labs";
import type {Topic} from "./schemas";

export type MediaIntegrityInput={media:Media[];labs:Lab[];badges:{id:string}[];topics:{subjectId:string;topic:Topic}[];fileExists:(file:string)=>boolean};
export function checkMediaIntegrity(input?:MediaIntegrityInput) {
  const data=input??{media:listMedia(),labs:listLabs(),badges:getBadges(),topics:listLiveTopics().map(t=>({subjectId:t.subjectId,topic:getTopic(t.subjectId,t.topicId)})),fileExists:(file:string)=>existsSync(join(process.cwd(),"public",file))};
  const errors:string[]=[];
  const prefixes=[...new Set(data.topics.flatMap(t=>t.topic.lesson.chunks.map(c=>c.id.replace(/\d+$/,""))))];
  const escape=(value:string)=>value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  const chunkTokens=prefixes.length?new RegExp(`\\b(?:${prefixes.map(escape).join("|")})\\d+\\b`,"g"):null;
  const media=new Set(data.media.map(m=>m.id)),labs=new Set(data.labs.map(l=>l.id)),badges=new Set(data.badges.map(b=>b.id));
  for(const [name,items] of [["media",data.media],["lab",data.labs]] as const) if(new Set(items.map(i=>i.id)).size!==items.length) errors.push(`Duplicate ${name} id`);
  for(const item of data.media) if(!data.fileExists(item.file)) errors.push(`Missing media file: ${item.file}`);
  for(const {subjectId,topic} of data.topics) for(const chunk of topic.lesson.chunks) for(const block of parseBlocks(chunk.body)) {
    if(block.type==="figure"&&!media.has(block.mediaId)) errors.push(`Unknown figure: ${block.mediaId}`);
    if(block.type==="lab") {
      if(!labs.has(block.labId)) errors.push(`Unknown lab: ${block.labId}`);
      const lab=data.labs.find(l=>l.id===block.labId);
      if(lab&&(lab.subjectId!==subjectId||lab.topicId!==topic.meta.id)) errors.push(`Lab ${lab.id} embedded in another topic`);
    }
  }
  for(const lab of data.labs) {
    const topic=data.topics.find(t=>t.subjectId===lab.subjectId&&t.topic.meta.id===lab.topicId&&t.topic.meta.status==="live")?.topic;
    if(!topic) errors.push(`Lab ${lab.id} has no live topic`);
    if(!badges.has(lab.badge)) errors.push(`Lab ${lab.id} has unknown badge: ${lab.badge}`);
    const chunks=new Set(topic?.lesson.chunks.map(c=>c.id));
    function walk(value:unknown) {
      if(typeof value==="string") for(const id of chunkTokens?value.match(chunkTokens)??[]:[]) {if(!chunks.has(id)) errors.push(`Lab ${lab.id} has unknown chunk: ${id}`);}
      else if(Array.isArray(value)) value.forEach(walk);
      else if(value&&typeof value==="object") for(const [key,child] of Object.entries(value)) {
        if(key==="chunk"||key==="chunks") for(const id of Array.isArray(child)?child:[child]) {if(!chunks.has(String(id))) errors.push(`Lab ${lab.id} has unknown chunk: ${id}`);}
        else if(key==="media"&&typeof child==="string"&&!media.has(child)) errors.push(`Lab ${lab.id} has unknown media: ${child}`);
        else walk(child);
      }
    }
    walk(lab);
  }
  return errors;
}
