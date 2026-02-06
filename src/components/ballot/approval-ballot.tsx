// src/components/ballot/approval-ballot.tsx
"use client";

import { useState } from "react";
import type { VoteOption } from "@/lib/types";

interface ApprovalBallotProps {
  options: VoteOption[];
  currentApproved: string[] | null;
  onVote: (approved: string[]) => void;
  disabled: boolean;
}

export function ApprovalBallot({
  options,
  currentApproved,
  onVote,
  disabled,
}: ApprovalBallotProps) {
  const [approved, setApproved] = useState<string[]>(
    () => currentApproved ?? []
  );

  const sortedOptions = [...options].sort(
    (a, b) => a.display_order - b.display_order
  );

  const hasChanged =
    currentApproved &&
    JSON.stringify([...approved].sort()) !==
      JSON.stringify([...currentApproved].sort());

  function toggleOption(optionId: string) {
    setApproved((prev) =>
      prev.includes(optionId)
        ? prev.filter((id) => id !== optionId)
        : [...prev, optionId]
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Select all options you approve of.
      </p>

      <div className="space-y-2">
        {sortedOptions.map((option) => {
          const isChecked = approved.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              disabled={disabled}
              className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors disabled:opacity-50 ${
                isChecked
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                  isChecked
                    ? "border-blue-600 bg-blue-600"
                    : "border-gray-300"
                }`}
              >
                {isChecked && (
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <span
                  className={`font-medium ${
                    isChecked ? "text-blue-700" : "text-gray-900"
                  }`}
                >
                  {option.label}
                </span>
                {option.description && (
                  <p className="mt-0.5 text-sm text-gray-500">
                    {option.description}
                  </p>
                )}
              </div>
              {isChecked && (
                <span className="ml-auto text-xs font-medium text-blue-600">
                  Approved
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onVote(approved)}
        disabled={disabled || approved.length === 0}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
      >
        {currentApproved ? "Update Approvals" : "Submit Approvals"}
      </button>

      {approved.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          Select at least one option to approve.
        </p>
      )}

      {currentApproved && !hasChanged && (
        <p className="text-center text-sm text-green-600">
          These are your current approvals.
        </p>
      )}
    </div>
  );
}
