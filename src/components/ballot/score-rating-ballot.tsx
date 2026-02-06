// src/components/ballot/score-rating-ballot.tsx
"use client";

import { useState } from "react";
import type { VoteOption } from "@/lib/types";

interface ScoreRatingBallotProps {
  options: VoteOption[];
  currentScores: Record<string, number> | null;
  onVote: (scores: Record<string, number>) => void;
  disabled: boolean;
}

export function ScoreRatingBallot({
  options,
  currentScores,
  onVote,
  disabled,
}: ScoreRatingBallotProps) {
  const [scores, setScores] = useState<Record<string, number>>(
    () => currentScores ?? {}
  );

  const sortedOptions = [...options].sort(
    (a, b) => a.display_order - b.display_order
  );

  const allRated = sortedOptions.every((opt) => scores[opt.id] != null);

  const hasChanged =
    currentScores &&
    JSON.stringify(scores) !== JSON.stringify(currentScores);

  function handleRate(optionId: string, value: number) {
    setScores((prev) => ({ ...prev, [optionId]: value }));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Rate each option from 1 to 5.
      </p>

      <div className="space-y-3">
        {sortedOptions.map((option) => (
          <div
            key={option.id}
            className="rounded-lg border-2 border-gray-200 bg-white px-4 py-3"
          >
            <div className="mb-2">
              <span className="font-medium text-gray-900">{option.label}</span>
              {option.description && (
                <p className="mt-0.5 text-sm text-gray-500">
                  {option.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => {
                const isSelected = scores[option.id] === value;
                const isFilled =
                  scores[option.id] != null && value <= scores[option.id];
                return (
                  <button
                    key={value}
                    onClick={() => handleRate(option.id, value)}
                    disabled={disabled}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                      isFilled
                        ? "border-yellow-400 bg-yellow-50 text-yellow-600"
                        : "border-gray-200 text-gray-400 hover:border-yellow-300 hover:bg-yellow-50"
                    } ${isSelected ? "ring-2 ring-yellow-400 ring-offset-1" : ""}`}
                    aria-label={`Rate ${option.label} ${value} out of 5`}
                  >
                    <svg
                      className="h-5 w-5"
                      fill={isFilled ? "currentColor" : "none"}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onVote(scores)}
        disabled={disabled || !allRated}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
      >
        {currentScores ? "Update Ratings" : "Submit Ratings"}
      </button>

      {!allRated && (
        <p className="text-center text-sm text-gray-500">
          Please rate all options before submitting.
        </p>
      )}

      {currentScores && !hasChanged && (
        <p className="text-center text-sm text-green-600">
          These are your current ratings.
        </p>
      )}
    </div>
  );
}
