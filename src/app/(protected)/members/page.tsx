import { getCurrentMember } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function MembersPage() {
  const member = await getCurrentMember();
  const adminClient = createAdminClient();

  // Fetch division name for heading
  const { data: division } = await adminClient
    .from("divisions")
    .select("name")
    .eq("id", member.division_id)
    .single();

  const divisionName = division?.name || "Your Division";

  // Show own division's members
  const { data: members } = await adminClient
    .from("members")
    .select("name, email, voting_member, observer")
    .eq("active", true)
    .eq("division_id", member.division_id)
    .order("name");

  const allMembers = (members || []) as {
    name: string | null;
    email: string;
    voting_member: boolean;
    observer: boolean;
  }[];

  const votingMembers = allMembers.filter((m) => m.voting_member && !m.observer);
  const shareholderTrack = allMembers.filter((m) => !m.voting_member && !m.observer);
  const observers = allMembers.filter((m) => m.observer);

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {divisionName} Members
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {allMembers.length} active member{allMembers.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="rounded-lg border bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900">
          Voting Shareholders ({votingMembers.length})
        </h2>
        <ul className="mt-3 divide-y divide-gray-100">
          {votingMembers.map((m) => (
            <li key={m.email} className="py-2 first:pt-0 last:pb-0">
              <div className="text-sm font-medium text-gray-900">
                {m.name || m.email}
              </div>
              {m.name && (
                <div className="text-xs text-gray-400">{m.email}</div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {shareholderTrack.length > 0 && (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            Shareholder Track ({shareholderTrack.length})
          </h2>
          <ul className="mt-3 divide-y divide-gray-100">
            {shareholderTrack.map((m) => (
              <li key={m.email} className="py-2 first:pt-0 last:pb-0">
                <div className="text-sm font-medium text-gray-900">
                  {m.name || m.email}
                </div>
                {m.name && (
                  <div className="text-xs text-gray-400">{m.email}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {observers.length > 0 && (
        <div className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900">
            Observers ({observers.length})
          </h2>
          <ul className="mt-3 divide-y divide-gray-100">
            {observers.map((m) => (
              <li key={m.email} className="py-2 first:pt-0 last:pb-0">
                <div className="text-sm font-medium text-gray-900">
                  {m.name || m.email}
                </div>
                {m.name && (
                  <div className="text-xs text-gray-400">{m.email}</div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
