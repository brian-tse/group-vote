"use client";

import { useTransition, useState } from "react";
import { openVote, closeVote, deleteVote } from "@/lib/actions/vote-admin-actions";

interface VoteAdminControlsProps {
  voteId: string;
  status: string;
}

export function VoteAdminControls({ voteId, status }: VoteAdminControlsProps) {
  const [isPending, startTransition] = useTransition();
  const [notifyMembers, setNotifyMembers] = useState(true);

  function handleOpen() {
    if (!confirm("Open this vote for members to cast ballots?")) return;
    startTransition(() => {
      openVote(voteId, notifyMembers);
    });
  }

  function handleClose() {
    if (!confirm("Close this vote? Members will no longer be able to vote."))
      return;
    startTransition(() => {
      closeVote(voteId, notifyMembers);
    });
  }

  function handleDelete() {
    if (
      !confirm(
        "Permanently delete this vote and all its ballots? This cannot be undone."
      )
    )
      return;
    startTransition(() => {
      deleteVote(voteId);
    });
  }

  return (
    <div className="space-y-3">
      {(status === "draft" || status === "open") && (
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={notifyMembers}
            onChange={(e) => setNotifyMembers(e.target.checked)}
            className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
          />
          Email all members when {status === "draft" ? "vote opens" : "vote closes"}
        </label>
      )}
      <div className="flex gap-3">
        {status === "draft" && (
          <button
            onClick={handleOpen}
            disabled={isPending}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
          >
            {isPending ? "Opening..." : "Open Vote"}
          </button>
        )}
        {status === "open" && (
          <button
            onClick={handleClose}
            disabled={isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
          >
            {isPending ? "Closing..." : "Close Vote"}
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-50"
        >
          {isPending ? "Deleting..." : "Delete Vote"}
        </button>
      </div>
    </div>
  );
}
