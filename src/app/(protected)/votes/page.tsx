import { getCurrentMember } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { VOTE_FORMAT_LABELS } from "@/lib/constants";
import type { Vote } from "@/lib/types";

export default async function VotesPage() {
  const member = await getCurrentMember();
  const adminClient = createAdminClient();

  // Fetch all closed votes
  const { data: closedVotes } = await adminClient
    .from("votes")
    .select("*")
    .eq("status", "closed")
    .order("closed_at", { ascending: false });

  const typedClosedVotes = (closedVotes || []) as Vote[];

  // Fetch all participation records for this member
  const { data: myParticipation } = await adminClient
    .from("participation_records")
    .select("vote_id, voted_at")
    .eq("member_id", member.id);

  const participatedMap = new Map<string, string>();
  for (const record of myParticipation || []) {
    participatedMap.set(record.vote_id, record.voted_at);
  }

  // Separate into voted and missed
  const votedIn = typedClosedVotes.filter((v) => participatedMap.has(v.id));
  const missed = typedClosedVotes.filter((v) => !participatedMap.has(v.id));

  const totalClosed = typedClosedVotes.length;
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
                  <span className="font-medium text-gray-900">
                    {vote.title}
                  </span>
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
                  <span className="font-medium text-gray-900">
                    {vote.title}
                  </span>
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
