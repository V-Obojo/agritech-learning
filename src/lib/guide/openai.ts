import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { buildGuidePrompt } from "./prompt";
import { modelGuideOutputSchema, type GuideRequest, type ModelGuideOutput } from "./types";

export async function liveGuide(request: GuideRequest): Promise<ModelGuideOutput> {
  const model = process.env.OPENAI_MODEL;
  if (!model?.trim()) throw new Error("OPENAI_MODEL is required for the live guide");
  const client = new OpenAI({ timeout: 20_000, maxRetries: 0 });
  const { instructions, input } = buildGuidePrompt(request);
  const response = await client.responses.parse({
    model, instructions, input,
    text: { format: zodTextFormat(modelGuideOutputSchema, "guide_answer") },
    store: false,
  });
  return modelGuideOutputSchema.parse(response.output_parsed);
}
