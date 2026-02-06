import { getCurrentMember } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { VOTE_FORMAT_LABELS } from "@/lib/constants";
import type { Vote } from "@/lib/types";

export default async function DashboardPage() {
  const member = await getCurrentMember();
  const adminClient = createAdminClient();

  // Fetch open votes
  const { data: openVotes } = await adminClient
    .from("votes")
    .select("*")
    .eq("status", "open")
    .order("created_at", { ascending: false });

  const typedOpenVotes = (openVotes || []) as Vote[];

  // Fetch recently closed votes (last 10)
  const { data: recentResults } = await adminClient
    .from("votes")
    .select("*")
    .eq("status", "closed")
    .order("closed_at", { ascending: false })
    .limit(10);

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {member.name || member.email}
        </h1>
      </div>

      {/* Open votes banner */}
      {pendingCount > 0 && (
        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-4">
          <p className="font-semibold text-blue-800">
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
                  className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm hover:border-blue-300 hover:shadow"
                >
                  <div>
                    <span className="font-medium text-gray-900">
                      {vote.title}
                    </span>
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
                className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm hover:border-blue-300 hover:shadow"
              >
                <div>
                  <span className="font-medium text-gray-900">
                    {vote.title}
                  </span>
                  <div className="mt-1 text-xs text-gray-500">
                    Closed{" "}
                    {vote.closed_at
                      ? new Date(vote.closed_at).toLocaleDateString()
                      : "recently"}
                  </div>
                </div>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  View results
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <a
          href="/propose"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Propose a Vote
        </a>
        <a
          href="/history"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          My Voting History
        </a>
        {member.role === "admin" && (
          <a
            href="/admin/votes"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Manage Votes
          </a>
        )}
      </div>
    </div>
  );
}
