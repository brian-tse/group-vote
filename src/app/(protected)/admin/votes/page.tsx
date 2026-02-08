import { requireAdmin } from "@/lib/auth";
import { isAdminRole, canAdminVote } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  VOTE_FORMAT_LABELS,
  PRIVACY_LEVEL_LABELS,
} from "@/lib/constants";
import type { Vote } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-800",
  pending_review: "bg-yellow-100 text-yellow-800",
  open: "bg-green-100 text-green-800",
  closed: "bg-navy-100 text-navy-500",
};

export default async function AdminVotesPage() {
  const member = await requireAdmin();

  const adminClient = createAdminClient();

  // Super-admins see all votes; division admins see their division + corp-wide
  const query = adminClient
    .from("votes")
    .select("*")
    .order("created_at", { ascending: false });

  const scopedQuery = member.role === "super_admin"
    ? query
    : query.or(`division_id.eq.${member.division_id},division_id.is.null`);

  const { data: votes, error } = await scopedQuery;

  if (error) {
    throw new Error(`Failed to load votes: ${error.message}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Votes</h1>
          <p className="mt-1 text-sm text-gray-500">
            {votes.length} vote{votes.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <a
          href="/votes/new"
          className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          Create Vote
        </a>
      </div>

      {votes.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
          No votes yet. Create the first one.
        </div>
      ) : (
        <div className="space-y-3">
          {votes.map((vote: Vote) => (
            <div
              key={vote.id}
              className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/votes/${vote.id}`}
                    className="font-medium text-gray-900 hover:text-brand-500"
                  >
                    {vote.title}
                  </a>
                  {vote.division_id === null && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                      Corp-wide
                    </span>
                  )}
                </div>
                <div className="mt-1 flex gap-3 text-xs text-gray-500">
                  <span>{VOTE_FORMAT_LABELS[vote.format]}</span>
                  <span>{PRIVACY_LEVEL_LABELS[vote.privacy_level]}</span>
                  {vote.deadline && (
                    <span>
                      Deadline:{" "}
                      {new Date(vote.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  STATUS_STYLES[vote.status] || STATUS_STYLES.draft
                }`}
              >
                {vote.status.replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
