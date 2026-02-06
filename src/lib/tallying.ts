import { createAdminClient } from "@/lib/supabase/admin";
import type { Vote, VoteOption, PassingThreshold } from "@/lib/types";

// ============================================================
// RESULT TYPES
// ============================================================

export interface YesNoResult {
  format: "yes_no";
  totalBallots: number;
  counts: { optionId: string; label: string; count: number }[];
  winner: { optionId: string; label: string; count: number } | null;
  passed: boolean;
  meetsQuorum: boolean;
  meetsThreshold: boolean;
  quorumRequired: number;
  quorumActual: number;
  thresholdRequired: number;
  thresholdActual: number;
}

export interface MultipleChoiceResult {
  format: "multiple_choice";
  totalBallots: number;
  counts: { optionId: string; label: string; count: number }[];
  winner: { optionId: string; label: string; count: number } | null;
  passed: boolean;
  meetsQuorum: boolean;
  meetsThreshold: boolean;
  quorumRequired: number;
  quorumActual: number;
  thresholdRequired: number;
  thresholdActual: number;
}

export interface RankedChoiceRound {
  roundNumber: number;
  counts: { optionId: string; label: string; count: number }[];
  eliminated: { optionId: string; label: string } | null;
  winner: { optionId: string; label: string; count: number } | null;
}

export interface RankedChoiceResult {
  format: "ranked_choice";
  totalBallots: number;
  rounds: RankedChoiceRound[];
  winner: { optionId: string; label: string; count: number } | null;
  passed: boolean;
  meetsQuorum: boolean;
  meetsThreshold: boolean;
  quorumRequired: number;
  quorumActual: number;
  thresholdRequired: number;
  thresholdActual: number;
}

export type VoteResult = YesNoResult | MultipleChoiceResult | RankedChoiceResult;

// ============================================================
// THRESHOLD HELPERS
// ============================================================

/**
 * Convert a passing threshold enum to a decimal fraction.
 */
function getThresholdFraction(
  threshold: PassingThreshold,
  customPercentage: number | null
): number {
  switch (threshold) {
    case "simple_majority":
      return 0.5;
    case "two_thirds":
      return 2 / 3;
    case "three_quarters":
      return 0.75;
    case "custom":
      if (customPercentage === null) {
        throw new Error("Custom threshold requires a percentage.");
      }
      return customPercentage / 100;
    default:
      return 0.5;
  }
}

// ============================================================
// FETCH BALLOTS
// ============================================================

async function fetchBallots(
  voteId: string,
  privacyLevel: string
): Promise<{ choice: any }[]> {
  const adminClient = createAdminClient();

  if (privacyLevel === "anonymous") {
    const { data, error } = await adminClient
      .from("ballot_records_anonymous")
      .select("choice")
      .eq("vote_id", voteId);

    if (error) throw new Error(`Failed to fetch ballots: ${error.message}`);
    return data || [];
  } else {
    const { data, error } = await adminClient
      .from("ballot_records_named")
      .select("choice")
      .eq("vote_id", voteId);

    if (error) throw new Error(`Failed to fetch ballots: ${error.message}`);
    return data || [];
  }
}

// ============================================================
// YES/NO TALLYING
// ============================================================

export async function tallyYesNo(
  vote: Vote,
  options: VoteOption[],
  activeMemberCount: number
): Promise<YesNoResult> {
  const ballots = await fetchBallots(vote.id, vote.privacy_level);
  const totalBallots = ballots.length;

  // Count per option
  const countMap = new Map<string, number>();
  for (const option of options) {
    countMap.set(option.id, 0);
  }

  for (const ballot of ballots) {
    const choice = ballot.choice as { option_id: string };
    const current = countMap.get(choice.option_id) || 0;
    countMap.set(choice.option_id, current + 1);
  }

  const counts = options.map((opt) => ({
    optionId: opt.id,
    label: opt.label,
    count: countMap.get(opt.id) || 0,
  }));

  // Determine winner (highest count)
  const sorted = [...counts].sort((a, b) => b.count - a.count);
  const winner = sorted[0]?.count > 0 ? sorted[0] : null;

  // Quorum check
  const quorumRequired = vote.quorum_percentage / 100;
  const quorumActual =
    activeMemberCount > 0 ? totalBallots / activeMemberCount : 0;
  const meetsQuorum = quorumActual >= quorumRequired;

  // Threshold check — for yes/no, threshold applies to the "Yes" option
  const thresholdFraction = getThresholdFraction(
    vote.passing_threshold,
    vote.custom_threshold_percentage
  );
  const yesOption = counts.find((c) => c.label === "Yes");
  const thresholdActual =
    totalBallots > 0 ? (yesOption?.count || 0) / totalBallots : 0;
  const meetsThreshold = thresholdActual > thresholdFraction;

  return {
    format: "yes_no",
    totalBallots,
    counts,
    winner,
    passed: meetsQuorum && meetsThreshold,
    meetsQuorum,
    meetsThreshold,
    quorumRequired: vote.quorum_percentage,
    quorumActual: Math.round(quorumActual * 100),
    thresholdRequired: Math.round(thresholdFraction * 100),
    thresholdActual: Math.round(thresholdActual * 100),
  };
}

// ============================================================
// MULTIPLE CHOICE TALLYING
// ============================================================

export async function tallyMultipleChoice(
  vote: Vote,
  options: VoteOption[],
  activeMemberCount: number
): Promise<MultipleChoiceResult> {
  const ballots = await fetchBallots(vote.id, vote.privacy_level);
  const totalBallots = ballots.length;

  // Count per option
  const countMap = new Map<string, number>();
  for (const option of options) {
    countMap.set(option.id, 0);
  }

  for (const ballot of ballots) {
    const choice = ballot.choice as { option_id: string };
    const current = countMap.get(choice.option_id) || 0;
    countMap.set(choice.option_id, current + 1);
  }

  const counts = options.map((opt) => ({
    optionId: opt.id,
    label: opt.label,
    count: countMap.get(opt.id) || 0,
  }));

  // Winner is highest count
  const sorted = [...counts].sort((a, b) => b.count - a.count);
  const winner = sorted[0]?.count > 0 ? sorted[0] : null;

  // Quorum check
  const quorumRequired = vote.quorum_percentage / 100;
  const quorumActual =
    activeMemberCount > 0 ? totalBallots / activeMemberCount : 0;
  const meetsQuorum = quorumActual >= quorumRequired;

  // Threshold check — winner's percentage of total ballots
  const thresholdFraction = getThresholdFraction(
    vote.passing_threshold,
    vote.custom_threshold_percentage
  );
  const thresholdActual =
    totalBallots > 0 && winner ? winner.count / totalBallots : 0;
  const meetsThreshold = thresholdActual > thresholdFraction;

  return {
    format: "multiple_choice",
    totalBallots,
    counts,
    winner,
    passed: meetsQuorum && meetsThreshold,
    meetsQuorum,
    meetsThreshold,
    quorumRequired: vote.quorum_percentage,
    quorumActual: Math.round(quorumActual * 100),
    thresholdRequired: Math.round(thresholdFraction * 100),
    thresholdActual: Math.round(thresholdActual * 100),
  };
}

// ============================================================
// RANKED CHOICE — INSTANT-RUNOFF TALLYING
// ============================================================
//
// Algorithm:
// 1. Count first-choice votes for each remaining candidate.
// 2. If any candidate has more than 50% of active ballots, they win.
// 3. Otherwise, eliminate the candidate with the fewest first-choice votes.
//    (Ties in elimination are broken by who had fewer votes in the previous
//     round; if still tied, the candidate with the higher display_order
//     is eliminated — arbitrary but deterministic.)
// 4. Redistribute eliminated candidate's ballots to each ballot's
//    next-highest-ranked candidate that is still active.
// 5. Repeat from step 1 until a winner is found or only one candidate remains.
// ============================================================

export async function tallyRankedChoice(
  vote: Vote,
  options: VoteOption[],
  activeMemberCount: number
): Promise<RankedChoiceResult> {
  const rawBallots = await fetchBallots(vote.id, vote.privacy_level);
  const totalBallots = rawBallots.length;

  // Parse each ballot's ranking into an ordered array of option IDs
  const ballots: string[][] = rawBallots.map((b) => {
    const choice = b.choice as { ranked: string[] };
    return choice.ranked;
  });

  // Build option lookup
  const optionMap = new Map<string, VoteOption>();
  for (const opt of options) {
    optionMap.set(opt.id, opt);
  }

  // Track which candidates are still active (not eliminated)
  const activeCandidates = new Set<string>(options.map((o) => o.id));

  // Store round-by-round results
  const rounds: RankedChoiceRound[] = [];

  // Track previous round counts for tiebreaking
  let previousRoundCounts = new Map<string, number>();

  let winner: { optionId: string; label: string; count: number } | null = null;
  let roundNumber = 0;

  while (activeCandidates.size > 1) {
    roundNumber++;

    // Count first-choice votes among active candidates
    const roundCounts = new Map<string, number>();
    for (const candidateId of activeCandidates) {
      roundCounts.set(candidateId, 0);
    }

    for (const ranking of ballots) {
      // Find the highest-ranked candidate that is still active
      const topChoice = ranking.find((id) => activeCandidates.has(id));
      if (topChoice) {
        roundCounts.set(topChoice, (roundCounts.get(topChoice) || 0) + 1);
      }
    }

    // Build counts array for this round
    const counts = Array.from(activeCandidates).map((id) => ({
      optionId: id,
      label: optionMap.get(id)?.label || "Unknown",
      count: roundCounts.get(id) || 0,
    }));

    // Count active ballots this round (ballots that have at least one active candidate)
    const activeBallotCount = counts.reduce((sum, c) => sum + c.count, 0);

    // Check for a majority winner (>50% of active ballots)
    const majorityThreshold = activeBallotCount / 2;
    const sortedCounts = [...counts].sort((a, b) => b.count - a.count);
    const topCandidate = sortedCounts[0];

    if (topCandidate && topCandidate.count > majorityThreshold) {
      // We have a winner
      winner = topCandidate;
      rounds.push({
        roundNumber,
        counts,
        eliminated: null,
        winner: topCandidate,
      });
      break;
    }

    // No majority — eliminate the candidate with the fewest votes
    // Sort ascending by count, then break ties:
    //   1. By previous round count (fewer = eliminated)
    //   2. By display_order (higher = eliminated)
    const sortedForElimination = [...counts].sort((a, b) => {
      if (a.count !== b.count) return a.count - b.count;
      // Tiebreaker 1: previous round count
      const aPrev = previousRoundCounts.get(a.optionId) || 0;
      const bPrev = previousRoundCounts.get(b.optionId) || 0;
      if (aPrev !== bPrev) return aPrev - bPrev;
      // Tiebreaker 2: display_order (higher = eliminated first)
      const aOrder = optionMap.get(a.optionId)?.display_order || 0;
      const bOrder = optionMap.get(b.optionId)?.display_order || 0;
      return bOrder - aOrder;
    });

    const eliminated = sortedForElimination[0];
    activeCandidates.delete(eliminated.optionId);

    rounds.push({
      roundNumber,
      counts,
      eliminated: {
        optionId: eliminated.optionId,
        label: eliminated.label,
      },
      winner: null,
    });

    previousRoundCounts = roundCounts;
  }

  // If we exit the loop with exactly one candidate remaining and no winner declared
  if (!winner && activeCandidates.size === 1) {
    const lastCandidateId = Array.from(activeCandidates)[0];
    const lastOption = optionMap.get(lastCandidateId);

    // Count final ballots for the last candidate
    let finalCount = 0;
    for (const ranking of ballots) {
      if (ranking.find((id) => activeCandidates.has(id))) {
        finalCount++;
      }
    }

    winner = {
      optionId: lastCandidateId,
      label: lastOption?.label || "Unknown",
      count: finalCount,
    };

    rounds.push({
      roundNumber: roundNumber + 1,
      counts: [
        {
          optionId: lastCandidateId,
          label: lastOption?.label || "Unknown",
          count: finalCount,
        },
      ],
      eliminated: null,
      winner,
    });
  }

  // Quorum check
  const quorumRequired = vote.quorum_percentage / 100;
  const quorumActual =
    activeMemberCount > 0 ? totalBallots / activeMemberCount : 0;
  const meetsQuorum = quorumActual >= quorumRequired;

  // Threshold check — for ranked choice, the winner's final-round percentage
  const thresholdFraction = getThresholdFraction(
    vote.passing_threshold,
    vote.custom_threshold_percentage
  );
  const thresholdActual =
    totalBallots > 0 && winner ? winner.count / totalBallots : 0;
  const meetsThreshold = thresholdActual > thresholdFraction;

  return {
    format: "ranked_choice",
    totalBallots,
    rounds,
    winner,
    passed: meetsQuorum && meetsThreshold,
    meetsQuorum,
    meetsThreshold,
    quorumRequired: vote.quorum_percentage,
    quorumActual: Math.round(quorumActual * 100),
    thresholdRequired: Math.round(thresholdFraction * 100),
    thresholdActual: Math.round(thresholdActual * 100),
  };
}

// ============================================================
// UNIFIED TALLY FUNCTION
// ============================================================

/**
 * Tally a vote based on its format. Returns the appropriate result type.
 */
export async function tallyVote(
  vote: Vote,
  options: VoteOption[],
  activeMemberCount: number
): Promise<VoteResult> {
  switch (vote.format) {
    case "yes_no":
      return tallyYesNo(vote, options, activeMemberCount);
    case "multiple_choice":
      return tallyMultipleChoice(vote, options, activeMemberCount);
    case "ranked_choice":
      return tallyRankedChoice(vote, options, activeMemberCount);
    default:
      throw new Error(`Unsupported vote format: ${vote.format}`);
  }
}
