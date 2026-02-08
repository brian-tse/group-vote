import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ProposalCard } from "./proposal-card";
import type { VoteProposal, Member } from "@/lib/types";

export default async function AdminProposalsPage() {
  const member = await requireAdmin();

  const adminClient = createAdminClient();

  // Division admins see proposals from their division; super-admins see all
  const query = adminClient
    .from("vote_proposals")
    .select("*, proposer:members!proposed_by(id, name, email)")
    .order("created_at", { ascending: true });

  const scopedQuery = member.role === "super_admin"
    ? query
    : query.eq("division_id", member.division_id);

  const { data: proposals, error } = await scopedQuery;

  if (error) {
    throw new Error(`Failed to load proposals: ${error.message}`);
  }

  const pending = proposals.filter(
    (p: VoteProposal) => p.status === "pending"
  );
  const reviewed = proposals.filter(
    (p: VoteProposal) => p.status !== "pending"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Review Proposals
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {pending.length} pending proposal{pending.length !== 1 ? "s" : ""}
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-gray-500">
          No pending proposals.
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((proposal: any) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-gray-900">
            Previously Reviewed
          </h2>
          <div className="space-y-4">
            {reviewed.map((proposal: any) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                readonly
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
