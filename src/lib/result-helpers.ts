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
  if (!result.meetsThreshold) {
    return `Failed — the winning option received ${result.thresholdActual}% of votes, but ${result.thresholdRequired}% was required to pass.`;
  }
  return `Passed — quorum met (${result.quorumActual}%) and threshold met (${result.thresholdActual}% vs ${result.thresholdRequired}% required).`;
}
