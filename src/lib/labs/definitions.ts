import {z} from "zod";
const text=z.string().min(1),number=z.number().finite().nonnegative();
const base=z.object({id:text,title:text,type:text,subjectId:text,topicId:text,instructions:text,exampleNote:text.optional()});
const cited=z.object({chunk:text});
export const waterSchema=base.extend({
  type:z.literal("water-simulator"),place:text,exampleNote:text,
  months:z.array(z.object({label:text,season:z.enum(["dry","wet"])})).min(1),
  pondNeed:z.object({wet:number,dry:number,unit:text,note:text}),
  sources:z.array(z.object({id:text,label:text,media:text.optional(),levels:z.array(number),note:text,chunks:z.array(text).min(1)})).min(1),
  questions:z.array(cited.extend({id:text,prompt:text,answer:text,explain:text})).min(1),
  completion:z.object({sourcesExplored:z.number().int().positive(),questionsAnswered:z.number().int().positive()}),
}).refine(l=>l.sources.every(s=>s.levels.length===l.months.length)&&l.completion.sourcesExplored<=l.sources.length&&l.completion.questionsAnswered<=l.questions.length,{message:"Unreachable water scenario"})
  .refine(l=>l.questions.every(q=>l.sources.some(s=>s.id===q.answer)||l.months.some(m=>m.season===q.answer)),{message:"Question has no authored options"});
export const challengeSchema=cited.extend({id:text,prompt:text,explain:text,check:z.object({length:number.optional(),width:number.optional(),square:z.boolean().optional(),minArea:number.optional(),maxArea:number.optional()})});
export const pondSchema=base.extend({
  type:z.literal("pond-builder"),
  limits:z.object({minSide:number,maxSide:number,step:z.number().positive(),minDepth:number,maxDepth:number,depthStep:z.number().positive()}),
  defaults:z.object({length:number,width:number,depth:number}),math:text,
  references:z.array(cited.extend({id:text,label:text,value:number,unit:z.enum(["m²","m"])})),
  setupTypes:z.array(z.object({id:text,label:text,media:text,text,chunks:z.array(text).min(1)})).min(1),
  challenges:z.array(challengeSchema).min(1),completion:z.object({challengesDone:z.number().int().positive()}),
}).refine(l=>l.limits.maxSide>=l.limits.minSide&&l.limits.maxDepth>=l.limits.minDepth&&l.completion.challengesDone<=l.challenges.length&&[l.defaults.length,l.defaults.width].every(v=>v>=l.limits.minSide&&v<=l.limits.maxSide)&&l.defaults.depth>=l.limits.minDepth&&l.defaults.depth<=l.limits.maxDepth,{message:"Invalid pond limits or defaults"});
export const elementSchema=z.object({id:text,label:text,visual:z.enum(["fish-surface","feed-floating","bird","water-muddy","fish-swimming","leaves","fish-feeding","fish-weak","smell"]),isSign:z.boolean(),explain:text,chunk:text.optional()});
export const sceneSchema=z.object({id:text,title:text,context:text,elements:z.array(elementSchema).min(1)});
export const observationSchema=base.extend({type:z.literal("observation"),scenes:z.array(sceneSchema).min(1),remedy:cited.extend({text}),completion:z.object({scenesDone:z.number().int().positive()})}).refine(l=>l.completion.scenesDone<=l.scenes.length&&l.scenes.every(s=>s.elements.some(e=>e.isSign)&&s.elements.filter(e=>e.isSign).every(e=>e.chunk)),{message:"Invalid observation completion or citations"});
export type WaterLab=z.infer<typeof waterSchema>;
export type PondLab=z.infer<typeof pondSchema>;
export type ObservationLab=z.infer<typeof observationSchema>;
export type Scene=z.infer<typeof sceneSchema>;
export type SceneElement=z.infer<typeof elementSchema>;
export type Challenge=z.infer<typeof challengeSchema>;
