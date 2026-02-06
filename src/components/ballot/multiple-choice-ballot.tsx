// src/components/ballot/multiple-choice-ballot.tsx
"use client";

import type { VoteOption } from "@/lib/types";

interface MultipleChoiceBallotProps {
  options: VoteOption[];
  currentChoice: string | null;
  onVote: (optionId: string) => void;
  disabled: boolean;
}

export function MultipleChoiceBallot({
  options,
  currentChoice,
  onVote,
  disabled,
}: MultipleChoiceBallotProps) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onVote(option.id)}
          disabled={disabled}
          className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors disabled:opacity-50 ${
            currentChoice === option.id
              ? "border-blue-600 bg-blue-50"
              : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50"
          }`}
        >
          <div
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
              currentChoice === option.id
                ? "border-blue-600 bg-blue-600"
                : "border-gray-300"
            }`}
          >
            {currentChoice === option.id && (
              <div className="h-2 w-2 rounded-full bg-white" />
            )}
          </div>
          <div>
            <span
              className={`font-medium ${
                currentChoice === option.id
                  ? "text-blue-700"
                  : "text-gray-900"
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
          {currentChoice === option.id && (
            <span className="ml-auto text-xs font-medium text-blue-600">
              Your vote
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
