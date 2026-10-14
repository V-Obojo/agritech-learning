import "server-only";
import { getActivity } from "../content";
import type { FeedbackEntry, FeedbackRequest, ModelFeedbackOutput } from "./types";

export function isTooShort(response: string): boolean {
  // Count letters and numbers, excluding padding, punctuation and emoji.
  return (response.match(/[\p{L}\p{N}]/gu) ?? []).length < 20;
}

export function defaultNextStepId(intention?: string): string {
  return intention === "considering" ? "dry-season-check" : "talk-farmer";
}

export function analyzeCoverage(request: FeedbackRequest) {
  const activity = getActivity();
  const response = request.response.toLowerCase();
  const coveredCriteria = activity.rubric.filter((criterion) => criterion.keywords.some((keyword) => {
    if (keyword === "?") return response.includes("?");
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const suffix = keyword === "test" ? "(?:s|ed|ing)?" : "";
    return new RegExp(`\\b${escaped}${suffix}\\b`, "i").test(response);
  }));
  const coveredIds = new Set(coveredCriteria.map((criterion) => criterion.id));
  const modelPoints = request.pathId === "fictional"
    ? activity.paths.find((path) => path.id === "fictional")?.modelPoints ?? [] : [];
  return {
    coveredCriteria,
    unmatchedCriteria: activity.rubric.filter((criterion) => !coveredIds.has(criterion.id)),
    coveredModelPointCount: modelPoints.filter((point) => coveredIds.has(point.criterion)).length,
    uncoveredModelPoints: modelPoints.filter((point) => !coveredIds.has(point.criterion)),
  };
}

export function mockFeedback(request: FeedbackRequest): ModelFeedbackOutput {
  const coverage = analyzeCoverage(request);
  const nextStepId = defaultNextStepId(request.intention);
  const strength = coverage.coveredCriteria[0];
  if (isTooShort(request.response) || !strength) {
    return { completed: false, strengths: [], toConsider: [], nextStepId };
  }
  const toConsider: FeedbackEntry[] = [];
  const modelPoint = coverage.uncoveredModelPoints[0];
  if (modelPoint) {
    toConsider.push({ criterionId: modelPoint.criterion,
      message: `What might this mean for Amina: "${modelPoint.point}"?`,
      chunkIds: modelPoint.chunks });
  }
  for (const criterion of coverage.unmatchedCriteria) {
    if (toConsider.length === 2) break;
    if (toConsider.some((entry) => entry.criterionId === criterion.id)) continue;
    toConsider.push({ criterionId: criterion.id,
      message: `What could you find out about this part of the checklist: "${criterion.description}"?`,
      chunkIds: criterion.chunks });
  }
  if (!toConsider.length) {
    const criterion = getActivity().rubric.find((criterion) => criterion.id === "open-questions")!;
    toConsider.push({ criterionId: criterion.id,
      message: `What else would you like to find out about this: "${criterion.description}"?`,
      chunkIds: criterion.chunks });
  }
  return {
    completed: true,
    strengths: [{ criterionId: strength.id, message: `You considered this: ${strength.description}`, chunkIds: strength.chunks }],
    toConsider, nextStepId,
  };
}
