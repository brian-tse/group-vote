import { getCurrentMember } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <a href="/dashboard" className="text-lg font-bold text-gray-900">
            Group Vote
          </a>
          <div className="flex items-center gap-4">
            <a
              href="/propose"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Propose
            </a>
            <a
              href="/votes"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              History
            </a>
            {member.role === "admin" && (
              <a
                href="/admin/votes"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Admin
              </a>
            )}
            <span className="text-sm text-gray-500">{member.email}</span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-900"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
