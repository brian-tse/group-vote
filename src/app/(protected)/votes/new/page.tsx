import { requireAdmin } from "@/lib/auth";
import { VoteForm } from "./vote-form";

export default async function NewVotePage() {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create a Vote</h1>
        <p className="mt-1 text-sm text-gray-500">
          Configure the vote settings. It will be saved as a draft until you
          open it for voting.
        </p>
      </div>
      <VoteForm />
    </div>
  );
}
