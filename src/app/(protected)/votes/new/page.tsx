import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { VoteForm } from "./vote-form";
import type { Division } from "@/lib/types";

export default async function NewVotePage() {
  const member = await requireAdmin();

  const adminClient = createAdminClient();
  const { data: divisions } = await adminClient
    .from("divisions")
    .select("*")
    .order("name");

  const typedDivisions = (divisions || []) as Division[];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create a Vote</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure the vote settings. It will be saved as a draft until you
          open it for voting.
        </p>
      </div>
      <VoteForm
        divisions={typedDivisions}
        memberRole={member.role}
        memberDivisionId={member.division_id}
      />
    </div>
  );
}
