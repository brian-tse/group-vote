import { getCurrentMember } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import {
  tallyVote,
  type VoteResult,
  type RankedChoiceResult,
  type DatePollResult,
  type ApprovalResult,
  type RsvpResult,
  type ScoreRatingResult,
  type MultiSelectResult,
} from "@/lib/tallying";
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
          className="mt-4 inline-block text-brand-500 hover:text-brand-700"
        >
          Back to vote
        </a>
      </div>
    );
  }

  // Fetch options and member counts in parallel
  const [{ data: options }, { count: activeMemberCount }, { data: votingMembers }] =
    await Promise.all([
      adminClient
        .from("vote_options")
        .select("*")
        .eq("vote_id", id)
        .order("display_order", { ascending: true }),
      adminClient
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("active", true),
      adminClient
        .from("members")
        .select("id")
        .eq("active", true)
        .eq("voting_member", true),
    ]);

  const typedOptions = (options || []) as VoteOption[];

  const votingMemberIds = (votingMembers || []).map((m: { id: string }) => m.id);
  const votingMemberCount = votingMemberIds.length;
  const hasNonVotingMembers = votingMemberCount < (activeMemberCount || 0);
  const isAnonymous = typedVote.privacy_level === "anonymous";

  // Official tally: voting shareholders only (quorum based on voting members)
  // For anonymous votes, we can't filter ballots by member, so official = all
  const result = await tallyVote(
    typedVote,
    typedOptions,
    votingMemberCount,
    isAnonymous ? undefined : votingMemberIds
  );

  // All-members tally (only needed if there are non-voting members and it's not anonymous)
  const allMembersResult = hasNonVotingMembers && !isAnonymous
    ? await tallyVote(typedVote, typedOptions, activeMemberCount || 0)
    : null;

  const status = getResultStatus(result);
  const explanation = getResultExplanation(result);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <a
          href={`/votes/${id}`}
          className="text-sm text-brand-500 hover:text-brand-700"
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
      <div className="rounded-lg border bg-white p-6">
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
        {hasNonVotingMembers && (
          <p className="mt-2 text-xs text-gray-400">
            {isAnonymous
              ? "This is an anonymous vote — ballots cannot be separated by voting status."
              : `Official tally based on ${votingMemberCount} voting shareholder${votingMemberCount !== 1 ? "s" : ""}.`}
          </p>
        )}
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
        <div className="rounded-lg border bg-white p-6">
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
                        isWinner ? "text-brand-700" : "text-gray-700"
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
                        isWinner ? "bg-brand-500" : "bg-gray-400"
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
              className="rounded-lg border bg-white p-6"
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
                                : "bg-brand-400"
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

      {/* Date Poll — table with Yes/No/Maybe columns */}
      {result.format === "date_poll" && (() => {
        const datePollResult = result as DatePollResult;
        return (
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Date Poll Results
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {datePollResult.totalBallots} response
              {datePollResult.totalBallots !== 1 ? "s" : ""} received
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-2 pr-4 font-medium text-gray-700">
                      Date
                    </th>
                    <th className="pb-2 px-4 text-center font-medium text-green-700">
                      Yes
                    </th>
                    <th className="pb-2 px-4 text-center font-medium text-yellow-700">
                      Maybe
                    </th>
                    <th className="pb-2 pl-4 text-center font-medium text-red-700">
                      No
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {datePollResult.options.map((opt) => {
                    const isWinner =
                      datePollResult.winner?.optionId === opt.optionId;
                    return (
                      <tr
                        key={opt.optionId}
                        className={`border-b last:border-b-0 ${
                          isWinner ? "bg-brand-50" : ""
                        }`}
                      >
                        <td className="py-3 pr-4">
                          <span
                            className={`font-medium ${
                              isWinner ? "text-brand-700" : "text-gray-700"
                            }`}
                          >
                            {opt.label}
                            {isWinner && " *"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-semibold text-green-800">
                            {opt.yes}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center justify-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-sm font-semibold text-yellow-800">
                            {opt.maybe}
                          </span>
                        </td>
                        <td className="py-3 pl-4 text-center">
                          <span className="inline-flex items-center justify-center rounded-full bg-red-100 px-2.5 py-0.5 text-sm font-semibold text-red-800">
                            {opt.no}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Approval — bar chart showing approval count per option */}
      {result.format === "approval" && (() => {
        const approvalResult = result as ApprovalResult;
        return (
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Approval Results
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {approvalResult.totalBallots} ballot
              {approvalResult.totalBallots !== 1 ? "s" : ""} cast
            </p>
            <div className="mt-4 space-y-3">
              {approvalResult.counts.map((item) => {
                const percentage =
                  approvalResult.totalBallots > 0
                    ? Math.round(
                        (item.count / approvalResult.totalBallots) * 100
                      )
                    : 0;
                const isWinner =
                  approvalResult.winner?.optionId === item.optionId;

                return (
                  <div key={item.optionId}>
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={`font-medium ${
                          isWinner ? "text-brand-700" : "text-gray-700"
                        }`}
                      >
                        {item.label}
                        {isWinner && " *"}
                      </span>
                      <span className="text-gray-500">
                        {item.count} approval{item.count !== 1 ? "s" : ""} (
                        {percentage}%)
                      </span>
                    </div>
                    <div className="mt-1 h-4 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isWinner ? "bg-brand-500" : "bg-gray-400"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* RSVP — three stat cards for Going / Not Going / Maybe */}
      {result.format === "rsvp" && (() => {
        const rsvpResult = result as RsvpResult;
        const goingPct =
          rsvpResult.totalBallots > 0
            ? Math.round(
                (rsvpResult.goingCount / rsvpResult.totalBallots) * 100
              )
            : 0;
        const notGoingPct =
          rsvpResult.totalBallots > 0
            ? Math.round(
                (rsvpResult.notGoingCount / rsvpResult.totalBallots) * 100
              )
            : 0;
        const maybePct =
          rsvpResult.totalBallots > 0
            ? Math.round(
                (rsvpResult.maybeCount / rsvpResult.totalBallots) * 100
              )
            : 0;

        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Attendance
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {rsvpResult.totalBallots} response
                {rsvpResult.totalBallots !== 1 ? "s" : ""} received
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="rounded-lg border bg-green-50 p-5 text-center">
                <div className="text-sm font-medium text-green-700">Going</div>
                <div className="mt-2 text-3xl font-bold text-green-800">
                  {rsvpResult.goingCount}
                </div>
                <div className="mt-1 text-sm text-green-600">{goingPct}%</div>
              </div>
              <div className="rounded-lg border bg-yellow-50 p-5 text-center">
                <div className="text-sm font-medium text-yellow-700">Maybe</div>
                <div className="mt-2 text-3xl font-bold text-yellow-800">
                  {rsvpResult.maybeCount}
                </div>
                <div className="mt-1 text-sm text-yellow-600">{maybePct}%</div>
              </div>
              <div className="rounded-lg border bg-red-50 p-5 text-center">
                <div className="text-sm font-medium text-red-700">
                  Not Going
                </div>
                <div className="mt-2 text-3xl font-bold text-red-800">
                  {rsvpResult.notGoingCount}
                </div>
                <div className="mt-1 text-sm text-red-600">{notGoingPct}%</div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Score Rating — average score per option with distribution */}
      {result.format === "score_rating" && (() => {
        const scoreResult = result as ScoreRatingResult;
        return (
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Score Ratings
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {scoreResult.totalBallots} ballot
              {scoreResult.totalBallots !== 1 ? "s" : ""} cast
            </p>
            <div className="mt-4 space-y-4">
              {scoreResult.options.map((opt) => {
                const isWinner =
                  scoreResult.winner?.optionId === opt.optionId;
                const fullStars = Math.floor(opt.averageScore);
                const hasHalf = opt.averageScore - fullStars >= 0.25 && opt.averageScore - fullStars < 0.75;
                const roundedUp = opt.averageScore - fullStars >= 0.75;

                return (
                  <div
                    key={opt.optionId}
                    className={`rounded-lg border p-4 ${
                      isWinner ? "border-brand-300 bg-brand-50" : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`font-medium ${
                          isWinner ? "text-brand-700" : "text-gray-700"
                        }`}
                      >
                        {opt.label}
                        {isWinner && " *"}
                      </span>
                      <span className="text-sm text-gray-500">
                        {opt.ratingCount} rating
                        {opt.ratingCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center gap-0.5 text-lg">
                        {Array.from({ length: 5 }, (_, i) => {
                          const starIndex = i + 1;
                          const filled =
                            starIndex <= fullStars ||
                            (roundedUp && starIndex === fullStars + 1);
                          const half =
                            hasHalf && starIndex === fullStars + 1;

                          return (
                            <span
                              key={i}
                              className={
                                filled
                                  ? "text-yellow-500"
                                  : half
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                              }
                            >
                              {filled ? "\u2605" : half ? "\u2605" : "\u2606"}
                            </span>
                          );
                        })}
                      </div>
                      <span className="text-lg font-bold text-gray-900">
                        {opt.averageScore.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-500">/ 5</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                      {[5, 4, 3, 2, 1].map((score) => (
                        <div key={score} className="flex items-center gap-0.5">
                          <span>{score}\u2605</span>
                          <span className="font-medium">
                            {opt.distribution[score] || 0}
                          </span>
                          {score > 1 && (
                            <span className="mx-1 text-gray-300">|</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Multi-Select — bar chart showing selection count per option */}
      {result.format === "multi_select" && (() => {
        const multiSelectResult = result as MultiSelectResult;
        return (
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Selection Results
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {multiSelectResult.totalBallots} ballot
              {multiSelectResult.totalBallots !== 1 ? "s" : ""} cast
            </p>
            <div className="mt-4 space-y-3">
              {multiSelectResult.counts.map((item) => {
                const percentage =
                  multiSelectResult.totalBallots > 0
                    ? Math.round(
                        (item.count / multiSelectResult.totalBallots) * 100
                      )
                    : 0;
                const isWinner =
                  multiSelectResult.winner?.optionId === item.optionId;

                return (
                  <div key={item.optionId}>
                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={`font-medium ${
                          isWinner ? "text-brand-700" : "text-gray-700"
                        }`}
                      >
                        {item.label}
                        {isWinner && " *"}
                      </span>
                      <span className="text-gray-500">
                        {item.count} selection{item.count !== 1 ? "s" : ""} (
                        {percentage}%)
                      </span>
                    </div>
                    <div className="mt-1 h-4 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isWinner ? "bg-brand-500" : "bg-gray-400"
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* All Members tally — shown when there are non-voting members and vote is not anonymous */}
      {allMembersResult && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6">
          <h2 className="text-lg font-semibold text-gray-700">
            All Members (Including Non-Voting)
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {allMembersResult.totalBallots} ballot{allMembersResult.totalBallots !== 1 ? "s" : ""} cast
            (vs. {result.totalBallots} from voting shareholders)
          </p>

          <div className="mt-3 flex gap-4">
            <div className="flex-1 rounded-lg border bg-white p-3">
              <div className="text-xs font-medium text-gray-500">Quorum (all members)</div>
              <div className="mt-1 text-lg font-bold">{allMembersResult.quorumActual}%</div>
            </div>
            {allMembersResult.winner && (
              <div className="flex-1 rounded-lg border bg-white p-3">
                <div className="text-xs font-medium text-gray-500">Top choice</div>
                <div className="mt-1 text-lg font-bold">{allMembersResult.winner.label}</div>
              </div>
            )}
          </div>

          {/* Simple bar chart for formats with counts */}
          {"counts" in allMembersResult && Array.isArray(allMembersResult.counts) && (
            <div className="mt-4 space-y-2">
              {(allMembersResult.counts as { optionId: string; label: string; count: number }[]).map((item) => {
                const percentage =
                  allMembersResult.totalBallots > 0
                    ? Math.round((item.count / allMembersResult.totalBallots) * 100)
                    : 0;
                return (
                  <div key={item.optionId}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="text-gray-400">
                        {item.count} ({percentage}%)
                      </span>
                    </div>
                    <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-gray-400"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
