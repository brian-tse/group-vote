import { getCurrentMember } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  VOTE_FORMAT_LABELS,
  PRIVACY_LEVEL_LABELS,
  PASSING_THRESHOLD_LABELS,
} from "@/lib/constants";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { BallotWrapper } from "@/components/ballot/ballot-wrapper";
import { VoteAdminControls } from "./vote-admin-controls";
import type { Vote, VoteOption } from "@/lib/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VoteDetailPage({ params }: Props) {
  const { id } = await params;
  const member = await getCurrentMember();
  const adminClient = createAdminClient();

  const { data: vote, error: voteError } = await adminClient
    .from("votes")
    .select("*")
    .eq("id", id)
    .single();

  if (voteError || !vote) {
    notFound();
  }

  if (
    member.role !== "admin" &&
    !["open", "closed"].includes(vote.status)
  ) {
    notFound();
  }

  const { data: options } = await adminClient
    .from("vote_options")
    .select("*")
    .eq("vote_id", id)
    .order("display_order");

  const { count: participationCount } = await adminClient
    .from("participation_records")
    .select("*", { count: "exact", head: true })
    .eq("vote_id", id);

  const { count: totalMembers } = await adminClient
    .from("members")
    .select("*", { count: "exact", head: true })
    .eq("active", true);

  const typedVote = vote as Vote;
  const allOptions = (options || []) as VoteOption[];

  // Extract max_selections config option for multi_select and filter it out
  let maxSelections: number | null = null;
  const typedOptions = allOptions.filter((opt) => {
    if (opt.label === "__max_selections__") {
      maxSelections = parseInt(opt.description || "3", 10);
      return false;
    }
    return true;
  });

  // Check if the current member has already voted
  const { data: participation } = await adminClient
    .from("participation_records")
    .select("id")
    .eq("vote_id", id)
    .eq("member_id", member.id)
    .single();

  const hasVoted = !!participation;

  // Get existing choice for non-anonymous votes
  let existingChoice: string | null = null;
  let existingRanking: string[] | null = null;
  let existingResponses: Record<string, string> | null = null;
  let existingApproved: string[] | null = null;
  let existingRsvpResponse: string | null = null;
  let existingScores: Record<string, number> | null = null;
  let existingSelected: string[] | null = null;
  let sessionToken: string | null = null;

  function extractChoiceData(choice: Record<string, unknown>) {
    if ("option_id" in choice) existingChoice = choice.option_id as string;
    if ("ranked" in choice) existingRanking = choice.ranked as string[];
    if ("responses" in choice) existingResponses = choice.responses as Record<string, string>;
    if ("approved" in choice) existingApproved = choice.approved as string[];
    if ("response" in choice) existingRsvpResponse = choice.response as string;
    if ("scores" in choice) existingScores = choice.scores as Record<string, number>;
    if ("selected" in choice) existingSelected = choice.selected as string[];
  }

  if (hasVoted) {
    if (typedVote.privacy_level === "anonymous") {
      const cookieStore = await cookies();
      sessionToken = cookieStore.get(`ballot_token_${id}`)?.value || null;
      if (sessionToken) {
        const { data: anonBallot } = await adminClient
          .from("ballot_records_anonymous")
          .select("choice")
          .eq("id", sessionToken)
          .eq("vote_id", id)
          .single();
        if (anonBallot) {
          extractChoiceData(anonBallot.choice as Record<string, unknown>);
        }
      }
    } else {
      const { data: namedBallot } = await adminClient
        .from("ballot_records_named")
        .select("choice")
        .eq("vote_id", id)
        .eq("member_id", member.id)
        .single();
      if (namedBallot) {
        extractChoiceData(namedBallot.choice as Record<string, unknown>);
      }
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{typedVote.title}</h1>
          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
            {typedVote.status.replace("_", " ")}
          </span>
        </div>
        {typedVote.description && (
          <p className="mt-2 text-gray-600">{typedVote.description}</p>
        )}
      </div>

      {member.role === "admin" && (
        <VoteAdminControls voteId={typedVote.id} status={typedVote.status} />
      )}

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">Vote Configuration</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-gray-500">Format</dt>
          <dd className="text-gray-900">{VOTE_FORMAT_LABELS[typedVote.format]}</dd>

          <dt className="text-gray-500">Privacy</dt>
          <dd className="text-gray-900">
            {PRIVACY_LEVEL_LABELS[typedVote.privacy_level]}
          </dd>

          <dt className="text-gray-500">Quorum</dt>
          <dd className="text-gray-900">{typedVote.quorum_percentage}%</dd>

          <dt className="text-gray-500">Threshold</dt>
          <dd className="text-gray-900">
            {PASSING_THRESHOLD_LABELS[typedVote.passing_threshold]}
            {typedVote.custom_threshold_percentage &&
              ` (${typedVote.custom_threshold_percentage}%)`}
          </dd>

          <dt className="text-gray-500">Deadline</dt>
          <dd className="text-gray-900">
            {typedVote.deadline
              ? new Date(typedVote.deadline).toLocaleString()
              : "Open-ended (admin closes)"}
          </dd>
        </dl>
      </div>

      {typedVote.status === "open" && (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Participation</h2>
          <div className="mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {participationCount ?? 0} of {totalMembers ?? 0} have voted
              </span>
              <span className="text-gray-500">
                {totalMembers
                  ? Math.round(
                      ((participationCount ?? 0) / totalMembers) * 100
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all"
                style={{
                  width: `${
                    totalMembers
                      ? Math.round(
                          ((participationCount ?? 0) / totalMembers) * 100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {typedVote.status === "open" && (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Cast Your Vote</h2>
          <div className="mt-4">
            <BallotWrapper
              voteId={typedVote.id}
              format={typedVote.format}
              privacyLevel={typedVote.privacy_level}
              options={typedOptions}
              existingChoice={existingChoice}
              existingRanking={existingRanking}
              existingResponses={existingResponses}
              existingApproved={existingApproved}
              existingRsvpResponse={existingRsvpResponse}
              existingScores={existingScores}
              existingSelected={existingSelected}
              maxSelections={maxSelections ?? undefined}
              hasVoted={hasVoted}
              sessionToken={sessionToken}
            />
          </div>
        </div>
      )}

      {typedVote.status === "closed" && (
        <div className="rounded-lg border bg-white p-4 text-center shadow-sm">
          <p className="text-gray-600">This vote is closed.</p>
          <a
            href={`/votes/${id}/results`}
            className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            View Results
          </a>
        </div>
      )}

      {typedVote.status !== "open" && typedVote.status !== "closed" && (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Options</h2>
          <ul className="mt-3 space-y-2">
            {typedOptions.map((option) => (
              <li
                key={option.id}
                className="rounded-lg border border-gray-200 px-4 py-3"
              >
                <span className="font-medium text-gray-900">{option.label}</span>
                {option.description && (
                  <p className="mt-1 text-sm text-gray-500">
                    {option.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
