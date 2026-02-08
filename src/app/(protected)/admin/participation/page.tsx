import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ParticipationTable } from "./participation-table";
import type { Member } from "@/lib/types";

export default async function AdminParticipationPage() {
  const currentMember = await requireAdmin();
  const adminClient = createAdminClient();

  // Scope to division for division admins, all for super-admins
  const membersQuery = adminClient
    .from("members")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  const scopedMembersQuery = currentMember.role === "super_admin"
    ? membersQuery
    : membersQuery.eq("division_id", currentMember.division_id);

  const { data: members } = await scopedMembersQuery;
  const typedMembers = (members || []) as Member[];

  // Fetch closed votes scoped by division (or all for super-admins)
  const closedVotesQuery = adminClient
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("status", "closed");

  const scopedClosedVotesQuery = currentMember.role === "super_admin"
    ? closedVotesQuery
    : closedVotesQuery.or(`division_id.eq.${currentMember.division_id},division_id.is.null`);

  const { count: closedVoteCount } = await scopedClosedVotesQuery;
  const totalClosedVotes = closedVoteCount || 0;

  // Fetch all participation records for closed votes
  const { data: allParticipation } = await adminClient
    .from("participation_records")
    .select("member_id, vote_id, votes!inner(status)")
    .eq("votes.status", "closed");

  // Count participation per member
  const memberParticipationCount = new Map<string, number>();
  for (const record of allParticipation || []) {
    const current = memberParticipationCount.get(record.member_id) || 0;
    memberParticipationCount.set(record.member_id, current + 1);
  }

  // Build the table data
  const tableData = typedMembers.map((m) => {
    const voted = memberParticipationCount.get(m.id) || 0;
    const missed = totalClosedVotes - voted;
    const rate =
      totalClosedVotes > 0 ? Math.round((voted / totalClosedVotes) * 100) : 0;

    return {
      id: m.id,
      name: m.name || m.email,
      email: m.email,
      voted,
      missed,
      rate,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Participation Dashboard
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {totalClosedVotes} closed vote{totalClosedVotes !== 1 ? "s" : ""} /{" "}
          {typedMembers.length} active member
          {typedMembers.length !== 1 ? "s" : ""}
        </p>
      </div>

      <ParticipationTable data={tableData} />
    </div>
  );
}
