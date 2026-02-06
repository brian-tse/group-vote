import { getCurrentMember } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const member = await getCurrentMember();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-navy-700 bg-navy-500">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <a href="/dashboard" className="text-lg font-bold text-white">
            ACAMG Voting
          </a>
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="text-sm text-white/70 hover:text-white"
            >
              Home
            </a>
            <a
              href="/propose"
              className="text-sm text-white/70 hover:text-white"
            >
              Propose
            </a>
            <a
              href="/votes"
              className="text-sm text-white/70 hover:text-white"
            >
              History
            </a>
            <a
              href="/help"
              className="text-sm text-white/70 hover:text-white"
            >
              Help
            </a>
            {member.role === "admin" && (
              <a
                href="/admin/votes"
                className="text-sm text-white/70 hover:text-white"
              >
                Admin
              </a>
            )}
            <span className="text-sm text-white/50">{member.email}</span>
            <span className="text-white/30">·</span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm text-white/50 hover:text-white"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
