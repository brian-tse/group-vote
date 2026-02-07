// src/components/ballot/yes-no-ballot.tsx
"use client";

import type { BallotOption } from "@/lib/types";

interface YesNoBallotProps {
  options: BallotOption[];
  currentChoice: string | null;
  onVote: (optionId: string) => void;
  disabled: boolean;
}

export function YesNoBallot({
  options,
  currentChoice,
  onVote,
  disabled,
}: YesNoBallotProps) {
  const yesOption = options.find((o) => o.label === "Yes");
  const noOption = options.find((o) => o.label === "No");

  if (!yesOption || !noOption) {
    return <p className="text-sm text-red-600">Invalid vote options.</p>;
  }

  return (
    <div className="flex gap-4">
      <button
        onClick={() => onVote(yesOption.id)}
        disabled={disabled}
        className={`flex-1 rounded-lg border-2 px-6 py-4 text-lg font-semibold transition-colors disabled:opacity-50 ${
          currentChoice === yesOption.id
            ? "border-green-600 bg-green-50 text-green-700 vote-select"
            : "border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50"
        }`}
      >
        Yes
        {currentChoice === yesOption.id && (
          <span className="ml-2 text-sm font-normal text-brand-600">(your vote)</span>
        )}
      </button>
      <button
        onClick={() => onVote(noOption.id)}
        disabled={disabled}
        className={`flex-1 rounded-lg border-2 px-6 py-4 text-lg font-semibold transition-colors disabled:opacity-50 ${
          currentChoice === noOption.id
            ? "border-red-600 bg-red-50 text-red-700 vote-select"
            : "border-gray-200 bg-white text-gray-700 hover:border-red-300 hover:bg-red-50"
        }`}
      >
        No
        {currentChoice === noOption.id && (
          <span className="ml-2 text-sm font-normal text-brand-600">(your vote)</span>
        )}
      </button>
    </div>
  );
}
