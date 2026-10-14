import "server-only";
import { getActivity, getLesson, getPathway } from "../content";
import type { GuideMode } from "../guide/types";
import { defaultNextStepId, isTooShort, mockFeedback } from "./mock";
import { liveFeedback } from "./openai";
import { feedbackRequestSchema, feedbackResponseSchema, modelFeedbackOutputSchema,
  type FeedbackEntry, type FeedbackRequest, type FeedbackResponse } from "./types";

export function postValidateFeedback(value: unknown, request: FeedbackRequest, mode: GuideMode): FeedbackResponse {
  const output = modelFeedbackOutputSchema.parse(value);
  const activity = getActivity();
  const pathway = getPathway();
  const chunkIds = new Set(getLesson().chunks.map((chunk) => chunk.id));
  function validateEntries(entries: FeedbackEntry[]) {
    return entries.flatMap((entry) => {
      if (!activity.rubric.some((criterion) => criterion.id === entry.criterionId)) return [];
      const validIds = [...new Set(entry.chunkIds.filter((id) => chunkIds.has(id)))];
      return validIds.length ? [{ ...entry, chunkIds: validIds }] : [];
    });
  }
  const completed = !isTooShort(request.response) && output.completed;
  const strengths = completed ? validateEntries(output.strengths).slice(0, 1) : [];
  const toConsider = completed ? validateEntries(output.toConsider).slice(0, 2) : [];
  if (completed && (!strengths.length || !toConsider.length)) {
    return postValidateFeedback(mockFeedback(request), request, "mock-fallback");
  }
  const nextStep = pathway.nextSteps.find((step) => step.id === output.nextStepId)
    ?? pathway.nextSteps.find((step) => step.id === defaultNextStepId(request.intention));
  if (!nextStep) throw new Error("Content feedback next step is missing");
  return feedbackResponseSchema.parse({ completed, strengths, toConsider,
    nextStep: { id: nextStep.id, label: nextStep.label }, mode,
    ...(!completed ? { hint: pathway.stuckHints[`activity-${request.pathId}`] } : {}),
  });
}

export async function giveFeedback(request: FeedbackRequest): Promise<FeedbackResponse> {
  const validated = feedbackRequestSchema.parse(request);
  if (isTooShort(validated.response)) return postValidateFeedback(mockFeedback(validated), validated, "mock");
  if (process.env.GUIDE_MODE === "live" && process.env.OPENAI_API_KEY) {
    try {
      return postValidateFeedback(await liveFeedback(validated), validated, "live");
    } catch (error) {
      console.error("Live feedback failed; using mock fallback", {
        name: error instanceof Error ? error.name : "UnknownError",
      });
      return postValidateFeedback(mockFeedback(validated), validated, "mock-fallback");
    }
  }
  return postValidateFeedback(mockFeedback(validated), validated, "mock");
}
