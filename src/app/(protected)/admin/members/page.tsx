import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AddMemberForm } from "./add-member-form";
import { MemberRow } from "./member-row";
import type { Division } from "@/lib/types";

export default async function AdminMembersPage() {
  const member = await requireAdmin();

  const adminClient = createAdminClient();

  // Fetch divisions for display
  const { data: divisions } = await adminClient
    .from("divisions")
    .select("*")
    .order("name");

  const typedDivisions = (divisions || []) as Division[];
  const divisionMap = new Map(typedDivisions.map((d) => [d.id, d]));

  // Division admins see only their division; super-admins see all
  const membersQuery = adminClient
    .from("members")
    .select("*")
    .order("name", { ascending: true });

  const scopedQuery = member.role === "super_admin"
    ? membersQuery
    : membersQuery.eq("division_id", member.division_id);

  const { data: members, error } = await scopedQuery;

  if (error) {
    throw new Error(`Failed to load members: ${error.message}`);
  }

  const activeCount = members.filter((m) => m.active).length;
  const votingCount = members.filter((m) => m.active && m.voting_member).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Members</h1>
        <p className="mt-1 text-sm text-gray-500">
          {activeCount} active member{activeCount !== 1 ? "s" : ""} of{" "}
          {members.length} total ({votingCount} voting shareholder{votingCount !== 1 ? "s" : ""})
        </p>
      </div>

      <AddMemberForm
        divisions={typedDivisions}
        memberRole={member.role}
        memberDivisionId={member.division_id}
      />

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Email
              </th>
              {member.role === "super_admin" && (
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Division
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Voting
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map((m) => (
              <MemberRow
                key={m.id}
                member={m}
                divisionName={divisionMap.get(m.division_id)?.slug?.toUpperCase()}
                showDivision={member.role === "super_admin"}
                isSuperAdmin={member.role === "super_admin"}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
