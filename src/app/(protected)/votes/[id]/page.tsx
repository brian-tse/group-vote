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
import { DescriptionDisplay } from "@/components/description-display";
import { CommentSection } from "@/components/comments/comment-section";
import type { Vote, VoteOption, VoteComment } from "@/lib/types";

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

  // Fetch options, participation count, member counts, and comments in parallel
  const [
    { data: options },
    { count: participationCount },
    { count: totalMembers },
    { count: votingMemberCount },
    { count: votingShareholderParticipation },
    { data: rawComments },
  ] = await Promise.all([
    adminClient
      .from("vote_options")
      .select("*")
      .eq("vote_id", id)
      .order("display_order"),
    adminClient
      .from("participation_records")
      .select("*", { count: "exact", head: true })
      .eq("vote_id", id),
    adminClient
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("active", true),
    adminClient
      .from("members")
      .select("*", { count: "exact", head: true })
      .eq("active", true)
      .eq("voting_member", true),
    adminClient
      .from("participation_records")
      .select("members!inner(voting_member)", { count: "exact", head: true })
      .eq("vote_id", id)
      .eq("members.voting_member", true),
    adminClient
      .from("vote_comments")
      .select("*, member:members(name, email)")
      .eq("vote_id", id)
      .order("created_at", { ascending: true }),
  ]);

  // Flatten joined member data into VoteComment objects
  const comments: VoteComment[] = (rawComments || []).map((c: Record<string, unknown>) => {
    const memberData = c.member as { name: string | null; email: string } | null;
    return {
      id: c.id as string,
      vote_id: c.vote_id as string,
      member_id: c.member_id as string,
      parent_id: c.parent_id as string | null,
      body: c.body as string,
      created_at: c.created_at as string,
      updated_at: c.updated_at as string,
      member_name: memberData?.name ?? null,
      member_email: memberData?.email ?? "",
    };
  });

  // Admin: fetch member participation details for open votes
  let votedMembers: { name: string | null; email: string; voting_member: boolean }[] = [];
  let notVotedMembers: { name: string | null; email: string; voting_member: boolean }[] = [];
  if (member.role === "admin" && vote.status === "open") {
    const [{ data: allMembers }, { data: participationRecords }] = await Promise.all([
      adminClient
        .from("members")
        .select("id, name, email, voting_member")
        .eq("active", true)
        .order("name"),
      adminClient
        .from("participation_records")
        .select("member_id")
        .eq("vote_id", id),
    ]);

    const votedIds = new Set((participationRecords || []).map((p: { member_id: string }) => p.member_id));
    for (const m of allMembers || []) {
      const entry = { name: (m as { name: string | null }).name, email: (m as { email: string }).email, voting_member: (m as { voting_member: boolean }).voting_member };
      if (votedIds.has((m as { id: string }).id)) {
        votedMembers.push(entry);
      } else {
        notVotedMembers.push(entry);
      }
    }
  }

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
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{typedVote.title}</h1>
          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
            {typedVote.status.replace("_", " ")}
          </span>
        </div>
        {typedVote.description && (
          <DescriptionDisplay content={typedVote.description} className="mt-2" />
        )}
      </div>

      {member.role === "admin" && (
        <VoteAdminControls voteId={typedVote.id} status={typedVote.status} />
      )}

      <div className="rounded-lg border bg-white p-5 shadow-sm">
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
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Participation</h2>
          <div className="mt-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                {participationCount ?? 0} of {totalMembers ?? 0} members have voted
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
            {votingMemberCount !== totalMembers && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {votingShareholderParticipation ?? 0} of {votingMemberCount ?? 0} voting shareholder{(votingMemberCount ?? 0) !== 1 ? "s" : ""} have voted
                  </span>
                  <span className="text-gray-500">
                    {votingMemberCount
                      ? Math.round(
                          ((votingShareholderParticipation ?? 0) / votingMemberCount) * 100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-brand-500 transition-all"
                    style={{
                      width: `${
                        votingMemberCount
                          ? Math.round(
                              ((votingShareholderParticipation ?? 0) / votingMemberCount) * 100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </>
            )}
            {votingMemberCount === totalMembers && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-brand-500 transition-all"
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
            )}
          </div>
        </div>
      )}

      {typedVote.status === "open" && member.role === "admin" && (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            Who Voted <span className="font-normal text-gray-400">(admin only)</span>
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <h3 className="text-xs font-medium text-green-700 uppercase tracking-wide">
                Voted ({votedMembers.length})
              </h3>
              {votedMembers.length === 0 ? (
                <p className="mt-1 text-sm text-gray-400">No one yet</p>
              ) : (
                <ul className="mt-1 space-y-0.5">
                  {votedMembers.map((m) => (
                    <li key={m.email} className="text-sm text-gray-700">
                      {m.name || m.email}
                      {!m.voting_member && (
                        <span className="ml-1 text-xs text-gray-400">(non-voting)</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3 className="text-xs font-medium text-red-700 uppercase tracking-wide">
                Not Yet Voted ({notVotedMembers.length})
              </h3>
              {notVotedMembers.length === 0 ? (
                <p className="mt-1 text-sm text-gray-400">Everyone voted!</p>
              ) : (
                <ul className="mt-1 space-y-0.5">
                  {notVotedMembers.map((m) => (
                    <li key={m.email} className="text-sm text-gray-700">
                      {m.name || m.email}
                      {!m.voting_member && (
                        <span className="ml-1 text-xs text-gray-400">(non-voting)</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {typedVote.status === "open" && !member.voting_member && (
        <div className="rounded-lg border-l-4 border-blue-400 bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-800">
            Your voice matters! As a shareholder-track member, your ballot is welcome and valued.
            It will be recorded separately from the official shareholder tally.
          </p>
        </div>
      )}

      {typedVote.status === "open" && (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">Cast Your Vote</h2>
          <div className="mt-4">
            <BallotWrapper
              voteId={typedVote.id}
              format={typedVote.format}
              privacyLevel={typedVote.privacy_level}
              options={typedOptions.map(({ id, label, description }) => ({ id, label, description }))}
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
        <div className="rounded-lg border bg-white p-5 text-center shadow-sm">
          <p className="text-gray-600">This vote is closed.</p>
          <a
            href={`/votes/${id}/results`}
            className="mt-2 inline-block text-sm font-medium text-brand-500 hover:text-brand-700"
          >
            View Results
          </a>
        </div>
      )}

      {typedVote.status !== "open" && typedVote.status !== "closed" && (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
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

      {(typedVote.status === "open" || typedVote.status === "closed") && (
        <CommentSection
          voteId={typedVote.id}
          comments={comments}
          currentMemberId={member.id}
          isAdmin={member.role === "admin"}
          isVoteOpen={typedVote.status === "open"}
        />
      )}
    </div>
  );
}
