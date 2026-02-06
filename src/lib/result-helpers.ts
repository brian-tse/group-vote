import type { VoteResult } from "@/lib/tallying";

export type ResultStatus = "Passed" | "Failed" | "Inconclusive";

/**
 * Determine the display status of a vote result.
 * - "Passed" = quorum met AND threshold met
 * - "Failed" = quorum met but threshold NOT met
 * - "Inconclusive" = quorum NOT met (regardless of threshold)
 */
export function getResultStatus(result: VoteResult): ResultStatus {
  if (!result.meetsQuorum) return "Inconclusive";
  if (result.passed) return "Passed";
  return "Failed";
}

export const RESULT_STATUS_STYLES: Record<ResultStatus, string> = {
  Passed: "bg-green-100 text-green-800",
  Failed: "bg-red-100 text-red-800",
  Inconclusive: "bg-yellow-100 text-yellow-800",
};

/**
 * Get a human-readable explanation of the result status.
 */
export function getResultExplanation(result: VoteResult): string {
  if (!result.meetsQuorum) {
    return `Inconclusive — quorum not met. ${result.quorumActual}% participated, but ${result.quorumRequired}% was required.`;
  }

  // RSVP uses attendance language instead of pass/fail
  if (result.format === "rsvp") {
    return `Quorum met (${result.quorumActual}%). ${result.goingCount} going, ${result.maybeCount} maybe, ${result.notGoingCount} not going out of ${result.totalBallots} responses.`;
  }

  // Date poll mentions the winning date
  if (result.format === "date_poll") {
    if (!result.meetsThreshold) {
      const winnerLabel = result.winner?.label ?? "No date";
      return `Failed — the top date "${winnerLabel}" received ${result.thresholdActual}% yes votes, but ${result.thresholdRequired}% was required to pass.`;
    }
    const winnerLabel = result.winner?.label ?? "No date";
    return `Passed — quorum met (${result.quorumActual}%) and the winning date "${winnerLabel}" received ${result.thresholdActual}% yes votes (${result.thresholdRequired}% required).`;
  }

  // Score rating uses average-based language
  if (result.format === "score_rating") {
    if (!result.meetsThreshold) {
      return `Failed — the top-rated option scored ${result.thresholdActual}% of the maximum rating, but ${result.thresholdRequired}% was required to pass.`;
    }
    return `Passed — quorum met (${result.quorumActual}%) and the top-rated option scored ${result.thresholdActual}% of the maximum rating (${result.thresholdRequired}% required).`;
  }

  if (!result.meetsThreshold) {
    return `Failed — the winning option received ${result.thresholdActual}% of votes, but ${result.thresholdRequired}% was required to pass.`;
  }
  return `Passed — quorum met (${result.quorumActual}%) and threshold met (${result.thresholdActual}% vs ${result.thresholdRequired}% required).`;
}
