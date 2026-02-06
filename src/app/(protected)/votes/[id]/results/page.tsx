import { getCurrentMember } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { tallyVote, type VoteResult, type RankedChoiceResult } from "@/lib/tallying";
import {
  getResultStatus,
  getResultExplanation,
  RESULT_STATUS_STYLES,
} from "@/lib/result-helpers";
import {
  VOTE_FORMAT_LABELS,
  PRIVACY_LEVEL_LABELS,
} from "@/lib/constants";
import type { Vote, VoteOption } from "@/lib/types";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await getCurrentMember();
  const adminClient = createAdminClient();

  // Fetch vote
  const { data: vote, error } = await adminClient
    .from("votes")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !vote) {
    notFound();
  }

  const typedVote = vote as Vote;

  if (typedVote.status !== "closed") {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center">
        <h1 className="text-xl font-bold text-gray-900">
          Results Not Available
        </h1>
        <p className="mt-2 text-gray-500">
          This vote is still open. Results will be available once it closes.
        </p>
        <a
          href={`/votes/${id}`}
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          Back to vote
        </a>
      </div>
    );
  }

  // Fetch options
  const { data: options } = await adminClient
    .from("vote_options")
    .select("*")
    .eq("vote_id", id)
    .order("display_order", { ascending: true });

  const typedOptions = (options || []) as VoteOption[];

  // Get active member count at close time
  const { count: activeMemberCount } = await adminClient
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("active", true);

  // Tally the vote
  const result = await tallyVote(
    typedVote,
    typedOptions,
    activeMemberCount || 0
  );

  const status = getResultStatus(result);
  const explanation = getResultExplanation(result);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <a
          href={`/votes/${id}`}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          &larr; Back to vote
        </a>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">
          {typedVote.title} — Results
        </h1>
        <div className="mt-2 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
            {VOTE_FORMAT_LABELS[typedVote.format]}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
            {PRIVACY_LEVEL_LABELS[typedVote.privacy_level]}
          </span>
        </div>
      </div>

      {/* Status badge and explanation */}
      <div className="rounded-lg border bg-white p-5">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
              RESULT_STATUS_STYLES[status]
            }`}
          >
            {status}
          </span>
          {result.winner && (
            <span className="text-lg font-bold text-gray-900">
              Winner: {result.winner.label}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-gray-600">{explanation}</p>
      </div>

      {/* Quorum and threshold badges */}
      <div className="flex gap-4">
        <div
          className={`flex-1 rounded-lg border p-4 ${
            result.meetsQuorum ? "bg-green-50" : "bg-yellow-50"
          }`}
        >
          <div className="text-sm font-medium text-gray-700">Quorum</div>
          <div className="mt-1 text-2xl font-bold">
            {result.quorumActual}%
          </div>
          <div className="text-xs text-gray-500">
            {result.quorumRequired}% required
          </div>
        </div>
        <div
          className={`flex-1 rounded-lg border p-4 ${
            result.meetsThreshold ? "bg-green-50" : "bg-red-50"
          }`}
        >
          <div className="text-sm font-medium text-gray-700">Threshold</div>
          <div className="mt-1 text-2xl font-bold">
            {result.thresholdActual}%
          </div>
          <div className="text-xs text-gray-500">
            {result.thresholdRequired}% required
          </div>
        </div>
      </div>

      {/* Vote breakdown — bar chart */}
      {(result.format === "yes_no" || result.format === "multiple_choice") && (
        <div className="rounded-lg border bg-white p-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Vote Breakdown
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {result.totalBallots} ballot{result.totalBallots !== 1 ? "s" : ""}{" "}
            cast
          </p>
          <div className="mt-4 space-y-3">
            {result.counts.map((item) => {
              const percentage =
                result.totalBallots > 0
                  ? Math.round((item.count / result.totalBallots) * 100)
                  : 0;
              const isWinner =
                result.winner?.optionId === item.optionId;

              return (
                <div key={item.optionId}>
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={`font-medium ${
                        isWinner ? "text-blue-700" : "text-gray-700"
                      }`}
                    >
                      {item.label}
                      {isWinner && " *"}
                    </span>
                    <span className="text-gray-500">
                      {item.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="mt-1 h-4 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isWinner ? "bg-blue-600" : "bg-gray-400"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Ranked choice — round-by-round display */}
      {result.format === "ranked_choice" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Round-by-Round Results
          </h2>
          <p className="text-sm text-gray-500">
            {result.totalBallots} ballot{result.totalBallots !== 1 ? "s" : ""}{" "}
            cast. Candidates are eliminated one by one until a winner is found.
          </p>

          {(result as RankedChoiceResult).rounds.map((round) => (
            <div
              key={round.roundNumber}
              className="rounded-lg border bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Round {round.roundNumber}
                </h3>
                {round.eliminated && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                    Eliminated: {round.eliminated.label}
                  </span>
                )}
                {round.winner && (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                    Winner: {round.winner.label}
                  </span>
                )}
              </div>
              <div className="mt-3 space-y-2">
                {round.counts.map((item) => {
                  const roundTotal = round.counts.reduce(
                    (sum, c) => sum + c.count,
                    0
                  );
                  const percentage =
                    roundTotal > 0
                      ? Math.round((item.count / roundTotal) * 100)
                      : 0;
                  const isWinner =
                    round.winner?.optionId === item.optionId;
                  const isEliminated =
                    round.eliminated?.optionId === item.optionId;

                  return (
                    <div key={item.optionId}>
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={`font-medium ${
                            isEliminated
                              ? "text-red-500 line-through"
                              : isWinner
                                ? "text-green-700"
                                : "text-gray-700"
                          }`}
                        >
                          {item.label}
                        </span>
                        <span className="text-gray-500">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full ${
                            isEliminated
                              ? "bg-red-300"
                              : isWinner
                                ? "bg-green-500"
                                : "bg-blue-400"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
