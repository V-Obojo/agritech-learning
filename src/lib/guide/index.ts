import "server-only";
import { getLesson, getPathway, getSources } from "../content";
import { mockGuide } from "./mock";
import { liveGuide } from "./openai";
import {
  guideRequestSchema, guideResponseSchema, modelGuideOutputSchema,
  type GuideMode, type GuideRequest, type GuideResponse,
} from "./types";

export function postValidateGuideOutput(value: unknown, mode: GuideMode): GuideResponse {
  const output = modelGuideOutputSchema.parse(value);
  const pathway = getPathway();
  const chunks = getLesson().chunks;
  const sources = getSources().sources;
  const citations = [...new Set(output.citedChunkIds)].flatMap((id) => {
    const chunk = chunks.find((chunk) => chunk.id === id);
    if (!chunk) return [];
    return [{
      chunkId: chunk.id, title: chunk.title,
      sources: chunk.sourceIds.map((sourceId) => {
        const source = sources.find((source) => source.id === sourceId);
        if (!source) throw new Error(`Unknown content source id: ${sourceId}`);
        return { id: source.id, title: source.title, url: source.url };
      }),
    }];
  });
  const supported = output.supported && citations.length > 0;
  const stepId = supported ? output.nextStepId : pathway.unsupportedFallback.nextStep;
  const nextStep = pathway.nextSteps.find((step) => step.id === stepId)
    ?? pathway.nextSteps.find((step) => step.id === pathway.unsupportedFallback.nextStep);
  if (!nextStep) throw new Error("Content fallback next step is missing");
  return guideResponseSchema.parse({
    answer: supported ? output.answer : pathway.unsupportedFallback.message,
    supported, citations: supported ? citations : [],
    nextStep: { id: nextStep.id, label: nextStep.label }, mode,
  });
}

export async function answerQuestion(request: GuideRequest): Promise<GuideResponse> {
  const validated = guideRequestSchema.parse(request);
  if (process.env.GUIDE_MODE === "live" && process.env.OPENAI_API_KEY) {
    try {
      return postValidateGuideOutput(await liveGuide(validated), "live");
    } catch (error) {
      // Log a safe error category, never SDK payloads, prompts, or credentials.
      console.error("Live guide failed; using mock fallback", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
      return postValidateGuideOutput(mockGuide(validated), "mock-fallback");
    }
  }
  return postValidateGuideOutput(mockGuide(validated), "mock");
}
