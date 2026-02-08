import { requireSuperAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { AddDivisionForm } from "./add-division-form";
import type { Division } from "@/lib/types";

export default async function AdminDivisionsPage() {
  await requireSuperAdmin();

  const adminClient = createAdminClient();

  const { data: divisions, error } = await adminClient
    .from("divisions")
    .select("*")
    .order("name");

  if (error) {
    throw new Error(`Failed to load divisions: ${error.message}`);
  }

  const typedDivisions = (divisions || []) as Division[];

  // Fetch member counts per division
  const { data: memberCounts } = await adminClient
    .from("members")
    .select("division_id")
    .eq("active", true);

  const countMap = new Map<string, number>();
  for (const m of memberCounts || []) {
    const divId = (m as { division_id: string }).division_id;
    countMap.set(divId, (countMap.get(divId) || 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manage Divisions</h1>
        <p className="mt-1 text-sm text-gray-500">
          {typedDivisions.length} division{typedDivisions.length !== 1 ? "s" : ""}
        </p>
      </div>

      <AddDivisionForm />

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Slug
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Active Members
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {typedDivisions.map((div) => (
              <tr key={div.id}>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                  {div.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {div.slug.toUpperCase()}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {countMap.get(div.id) || 0}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {new Date(div.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
