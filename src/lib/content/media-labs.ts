import { z } from "zod";

const text = z.string().trim().min(1);
export const mediaSchema = z.object({
  id: text, file: z.string().regex(/^\/media\/[\w.-]+$/),
  width: z.number().int().positive(), height: z.number().int().positive(),
  alt: text, caption: text, credit: text, license: text,
  licenseUrl: z.url().nullable(), sourceUrl: z.url(),
});
export const mediaRegistrySchema = z.object({media: z.array(mediaSchema).min(1)});
const base = z.object({id:text, type:text, title:text, teaser:text, subjectId:text, topicId:text, badge:text, instructions:text});
export const modelLabSchema = base.extend({
  type:z.literal("model-viewer"),
  model:z.object({kind:z.literal("procedural"),species:text,notes:text,bodyColors:z.object({back:text,side:text,belly:text})}),
  modes:z.array(z.object({id:text,label:text,note:text,chunk:text.optional()})).min(2),
  hotspots:z.array(z.object({id:text,part:text,label:text,text,chunk:text})).min(1),
  completion:z.object({hotspotsVisited:z.number().int().positive(),modesViewed:z.number().int().positive()}),
}).refine(lab=>lab.completion.hotspotsVisited<=lab.hotspots.length&&lab.completion.modesViewed<=lab.modes.length,{message:"Unreachable completion criteria"})
  .refine(lab=>new Set(lab.hotspots.map(h=>h.id)).size===lab.hotspots.length&&new Set(lab.modes.map(m=>m.id)).size===lab.modes.length,{message:"Duplicate hotspot or mode ids"});
const reference=z.object({chunk:text.optional(),chunks:z.array(text).optional(),media:text.optional()}).passthrough();
const futureLabSchema=base.extend({
  type:z.enum(["water-simulator","pond-builder","observation"]),
  exampleNote:text.optional(), sources:z.array(reference).optional(), references:z.array(reference).optional(),
  setupTypes:z.array(reference).optional(),challenges:z.array(reference).optional(),
  scenes:z.array(reference.extend({elements:z.array(reference)})).optional(),remedy:reference.optional(),
  completion:z.record(text,z.number().int().positive()),
}).passthrough();
export const labSchema=z.union([modelLabSchema,futureLabSchema]);
export const labsRegistrySchema=z.object({labs:z.array(labSchema).min(1)});
export type Media=z.infer<typeof mediaSchema>;
export type Lab=z.infer<typeof labSchema>;
export type ModelLab=z.infer<typeof modelLabSchema>;
