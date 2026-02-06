import { getCurrentMember } from "@/lib/auth";
import { ProposeForm } from "./propose-form";

export default async function ProposePage() {
  await getCurrentMember();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Propose a Vote</h1>
        <p className="mt-1 text-sm text-gray-500">
          Suggest a topic for the group to vote on. An admin will review your
          proposal before it goes live.
        </p>
      </div>
      <ProposeForm />
    </div>
  );
}
