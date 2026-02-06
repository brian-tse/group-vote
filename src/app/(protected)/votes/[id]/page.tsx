import { getCurrentMember } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  VOTE_FORMAT_LABELS,
  PRIVACY_LEVEL_LABELS,
  PASSING_THRESHOLD_LABELS,
} from "@/lib/constants";
import { notFound } from "next/navigation";
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
  const typedOptions = (options || []) as VoteOption[];

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

      {typedVote.status === "open" && (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
          Ballot casting will be implemented in Phase 7.
        </div>
      )}
    </div>
  );
}
