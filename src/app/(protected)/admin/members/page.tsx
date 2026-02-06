import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AddMemberForm } from "./add-member-form";
import { MemberRow } from "./member-row";

export default async function AdminMembersPage() {
  await requireAdmin();

  const adminClient = createAdminClient();
  const { data: members, error } = await adminClient
    .from("members")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load members: ${error.message}`);
  }

  const activeCount = members.filter((m) => m.active).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Members</h1>
        <p className="mt-1 text-sm text-gray-500">
          {activeCount} active member{activeCount !== 1 ? "s" : ""} of{" "}
          {members.length} total
        </p>
      </div>

      <AddMemberForm />

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
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {members.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
