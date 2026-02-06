"use client";

import { useTransition, useState } from "react";
import {
  approveProposal,
  rejectProposal,
} from "./actions";
import {
  VOTE_FORMAT_LABELS,
  PRIVACY_LEVEL_LABELS,
  PASSING_THRESHOLD_LABELS,
} from "@/lib/constants";

interface ProposalCardProps {
  proposal: {
    id: string;
    title: string;
    description: string | null;
    format: string;
    privacy_level: string;
    options: string;
    quorum_percentage: number;
    passing_threshold: string;
    custom_threshold_percentage: number | null;
    status: string;
    admin_notes: string | null;
    created_at: string;
    proposer: { id: string; name: string | null; email: string };
  };
  readonly?: boolean;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export function ProposalCard({ proposal, readonly }: ProposalCardProps) {
  const [isPending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");

  const parsedOptions = (() => {
    try {
      return typeof proposal.options === "string"
        ? JSON.parse(proposal.options)
        : proposal.options;
    } catch {
      return [];
    }
  })();

  function handleApprove() {
    if (!confirm("Approve this proposal and create the vote?")) return;
    startTransition(() => {
      approveProposal(proposal.id);
    });
  }

  function handleReject() {
    startTransition(() => {
      rejectProposal(proposal.id, rejectNotes || null);
    });
  }

  return (
    <div
      className={`rounded-lg border bg-white p-5 shadow-sm ${
        isPending ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {proposal.title}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            Proposed by {proposal.proposer.name || proposal.proposer.email} on{" "}
            {new Date(proposal.created_at).toLocaleDateString()}
          </p>
        </div>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            STATUS_STYLES[proposal.status] || STATUS_STYLES.pending
          }`}
        >
          {proposal.status}
        </span>
      </div>

      {proposal.description && (
        <p className="mt-3 text-sm text-gray-700">{proposal.description}</p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium text-gray-500">Format:</span>{" "}
          {VOTE_FORMAT_LABELS[proposal.format] || proposal.format}
        </div>
        <div>
          <span className="font-medium text-gray-500">Privacy:</span>{" "}
          {PRIVACY_LEVEL_LABELS[proposal.privacy_level] ||
            proposal.privacy_level}
        </div>
        <div>
          <span className="font-medium text-gray-500">Quorum:</span>{" "}
          {proposal.quorum_percentage}%
        </div>
        <div>
          <span className="font-medium text-gray-500">Threshold:</span>{" "}
          {PASSING_THRESHOLD_LABELS[proposal.passing_threshold] ||
            proposal.passing_threshold}
          {proposal.custom_threshold_percentage &&
            ` (${proposal.custom_threshold_percentage}%)`}
        </div>
      </div>

      {parsedOptions.length > 0 && (
        <div className="mt-3">
          <span className="text-sm font-medium text-gray-500">Options:</span>
          <ul className="mt-1 list-inside list-disc text-sm text-gray-700">
            {parsedOptions.map(
              (opt: { label: string; description?: string }, idx: number) => (
                <li key={idx}>
                  {opt.label}
                  {opt.description && (
                    <span className="text-gray-500">
                      {" "}
                      — {opt.description}
                    </span>
                  )}
                </li>
              )
            )}
          </ul>
        </div>
      )}

      {proposal.admin_notes && (
        <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm text-gray-600">
          <span className="font-medium">Admin notes:</span>{" "}
          {proposal.admin_notes}
        </div>
      )}

      {!readonly && proposal.status === "pending" && (
        <div className="mt-4 flex items-center gap-3 border-t pt-4">
          <button
            onClick={handleApprove}
            disabled={isPending}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
          >
            Approve & Create Vote
          </button>
          {!showReject ? (
            <button
              onClick={() => setShowReject(true)}
              disabled={isPending}
              className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Reject
            </button>
          ) : (
            <div className="flex flex-1 items-center gap-2">
              <input
                type="text"
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="Reason (optional)"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <button
                onClick={handleReject}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => setShowReject(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
