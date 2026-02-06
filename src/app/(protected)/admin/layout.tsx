import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <nav className="flex gap-4 border-b pb-3">
        <a
          href="/admin/votes"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Manage Votes
        </a>
        <a
          href="/admin/members"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Members
        </a>
        <a
          href="/admin/proposals"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Proposals
        </a>
        <a
          href="/admin/participation"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          Participation
        </a>
      </nav>
      {children}
    </div>
  );
}
