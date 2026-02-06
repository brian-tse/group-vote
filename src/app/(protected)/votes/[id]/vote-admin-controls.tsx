"use client";

import { useTransition } from "react";
import { openVote, closeVote, deleteVote } from "@/lib/actions/vote-admin-actions";

interface VoteAdminControlsProps {
  voteId: string;
  status: string;
}

export function VoteAdminControls({ voteId, status }: VoteAdminControlsProps) {
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    if (!confirm("Open this vote for members to cast ballots?")) return;
    startTransition(() => {
      openVote(voteId);
    });
  }

  function handleClose() {
    if (!confirm("Close this vote? Members will no longer be able to vote."))
      return;
    startTransition(() => {
      closeVote(voteId);
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
  );
}
