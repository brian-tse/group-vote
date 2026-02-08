import { getCurrentMember } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { VOTE_FORMAT_LABELS } from "@/lib/constants";
import type { Vote } from "@/lib/types";

export default async function VotesPage() {
  const member = await getCurrentMember();
  const adminClient = createAdminClient();

  // Fetch votes and participation records in parallel
  // Filter: member's division OR corp-wide
  const [{ data: allVotes }, { data: myParticipation }] = await Promise.all([
    adminClient
      .from("votes")
      .select("*")
      .in("status", ["open", "closed"])
      .or(`division_id.eq.${member.division_id},division_id.is.null`)
      .order("created_at", { ascending: false }),
    adminClient
      .from("participation_records")
      .select("vote_id, voted_at")
      .eq("member_id", member.id),
  ]);

  const typedVotes = (allVotes || []) as Vote[];
  const closedVotes = typedVotes.filter((v) => v.status === "closed");
  const openVotes = typedVotes.filter((v) => v.status === "open");

  const participatedMap = new Map<string, string>();
  for (const record of myParticipation || []) {
    participatedMap.set(record.vote_id, record.voted_at);
  }

  // Open votes the member has voted on
  const openVotedIn = openVotes.filter((v) => participatedMap.has(v.id));

  // Closed votes: voted vs missed
  const votedIn = closedVotes.filter((v) => participatedMap.has(v.id));
  const missed = closedVotes.filter((v) => !participatedMap.has(v.id));

  const totalClosed = closedVotes.length;
  const participationRate =
    totalClosed > 0 ? Math.round((votedIn.length / totalClosed) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          My Voting History
        </h1>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="rounded-lg border bg-white p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {votedIn.length}
          </div>
          <div className="text-sm text-gray-500">Votes participated</div>
        </div>
        <div className="rounded-lg border bg-white p-4 text-center">
          <div className="text-2xl font-bold text-red-500">
            {missed.length}
          </div>
          <div className="text-sm text-gray-500">Votes missed</div>
        </div>
        <div className="rounded-lg border bg-white p-4 text-center">
          <div className="text-2xl font-bold text-brand-500">
            {participationRate}%
          </div>
          <div className="text-sm text-gray-500">Participation rate</div>
        </div>
      </div>

      {/* Open votes voted on */}
      {openVotedIn.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Open Votes</h2>
          <div className="mt-3 space-y-2">
            {openVotedIn.map((vote) => (
              <a
                key={vote.id}
                href={`/votes/${vote.id}`}
                className="flex items-center justify-between rounded-lg border bg-white px-5 py-4 shadow-sm hover:border-brand-300"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {vote.title}
                    </span>
                    {vote.division_id === null && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                        Corp-wide
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {VOTE_FORMAT_LABELS[vote.format]} — Voted{" "}
                    {new Date(
                      participatedMap.get(vote.id)!
                    ).toLocaleDateString()}
                  </div>
                </div>
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  Open
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Voted in */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Participated</h2>
        {votedIn.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">
            You haven&apos;t voted in any closed votes yet.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {votedIn.map((vote) => (
              <a
                key={vote.id}
                href={`/votes/${vote.id}/results`}
                className="flex items-center justify-between rounded-lg border bg-white px-5 py-4 shadow-sm hover:border-brand-300"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {vote.title}
                    </span>
                    {vote.division_id === null && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                        Corp-wide
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {VOTE_FORMAT_LABELS[vote.format]} — Voted{" "}
                    {new Date(
                      participatedMap.get(vote.id)!
                    ).toLocaleDateString()}
                  </div>
                </div>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Voted
                </span>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* Missed */}
      {missed.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Missed</h2>
          <div className="mt-3 space-y-2">
            {missed.map((vote) => (
              <a
                key={vote.id}
                href={`/votes/${vote.id}/results`}
                className="flex items-center justify-between rounded-lg border bg-white px-5 py-4 shadow-sm hover:border-brand-300"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {vote.title}
                    </span>
                    {vote.division_id === null && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                        Corp-wide
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500">
                    {VOTE_FORMAT_LABELS[vote.format]} — Closed{" "}
                    {vote.closed_at
                      ? new Date(vote.closed_at).toLocaleDateString()
                      : ""}
                  </div>
                </div>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                  Missed
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
