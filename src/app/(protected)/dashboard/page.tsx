import { getCurrentMember } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { VOTE_FORMAT_LABELS } from "@/lib/constants";
import type { Vote } from "@/lib/types";

function DivisionBadge({ vote }: { vote: Vote }) {
  if (vote.division_id === null) {
    return (
      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
        Corp-wide
      </span>
    );
  }
  return null;
}

export default async function DashboardPage() {
  const member = await getCurrentMember();
  const adminClient = createAdminClient();

  // Fetch open votes and recent results in parallel
  // Filter: member's division OR corp-wide (division_id IS NULL)
  const [{ data: openVotes }, { data: recentResults }] = await Promise.all([
    adminClient
      .from("votes")
      .select("*")
      .eq("status", "open")
      .or(`division_id.eq.${member.division_id},division_id.is.null`)
      .order("created_at", { ascending: false }),
    adminClient
      .from("votes")
      .select("*")
      .eq("status", "closed")
      .or(`division_id.eq.${member.division_id},division_id.is.null`)
      .order("closed_at", { ascending: false })
      .limit(10),
  ]);

  const typedOpenVotes = (openVotes || []) as Vote[];
  const typedRecentResults = (recentResults || []) as Vote[];

  // Check which open votes the member has already voted on
  const openVoteIds = typedOpenVotes.map((v) => v.id);
  const { data: myParticipation } = await adminClient
    .from("participation_records")
    .select("vote_id")
    .eq("member_id", member.id)
    .in("vote_id", openVoteIds.length > 0 ? openVoteIds : ["none"]);

  const votedOnIds = new Set(
    (myParticipation || []).map((p: { vote_id: string }) => p.vote_id)
  );

  const pendingVotes = typedOpenVotes.filter((v) => !votedOnIds.has(v.id));
  const pendingCount = pendingVotes.length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {member.name || member.email}
        </h1>
      </div>

      {/* Open votes banner */}
      {pendingCount > 0 && (
        <div className="rounded-lg border-l-4 border-brand-500 bg-brand-50 p-4">
          <p className="font-semibold text-brand-800">
            You have {pendingCount} open vote{pendingCount !== 1 ? "s" : ""}{" "}
            awaiting your ballot.
          </p>
        </div>
      )}

      {/* Open votes list */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Open Votes</h2>
        {typedOpenVotes.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            No votes currently open.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {typedOpenVotes.map((vote) => {
              const hasVoted = votedOnIds.has(vote.id);
              return (
                <a
                  key={vote.id}
                  href={`/votes/${vote.id}`}
                  className={`flex items-center justify-between rounded-lg border bg-white px-5 py-4 shadow-sm hover:border-brand-300 hover:shadow ${
                    !hasVoted ? "border-l-4 border-brand-500" : ""
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {vote.title}
                      </span>
                      <DivisionBadge vote={vote} />
                    </div>
                    <div className="mt-1 flex gap-2 text-xs text-gray-500">
                      <span>{VOTE_FORMAT_LABELS[vote.format]}</span>
                      {vote.deadline && (
                        <span>
                          Deadline:{" "}
                          {new Date(vote.deadline).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      hasVoted
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {hasVoted ? "Voted" : "Needs your vote"}
                  </span>
                </a>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent results */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Recent Results
        </h2>
        {typedRecentResults.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            No votes have been completed yet.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {typedRecentResults.map((vote) => (
              <a
                key={vote.id}
                href={`/votes/${vote.id}/results`}
                className="flex items-center justify-between rounded-lg border bg-white px-5 py-4 shadow-sm hover:border-brand-300 hover:shadow"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {vote.title}
                    </span>
                    <DivisionBadge vote={vote} />
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Closed{" "}
                    {vote.closed_at
                      ? new Date(vote.closed_at).toLocaleDateString()
                      : "recently"}
                  </div>
                </div>
                <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy-500">
                  View results
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <a
          href="/propose"
          className="rounded-lg border border-brand-300 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
        >
          Propose a Vote
        </a>
        <a
          href="/votes"
          className="rounded-lg border border-brand-300 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
        >
          My Voting History
        </a>
        {isAdminRole(member.role) && (
          <a
            href="/admin/votes"
            className="rounded-lg border border-brand-300 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-50"
          >
            Manage Votes
          </a>
        )}
      </div>
    </div>
  );
}
