// src/components/ballot/multi-select-ballot.tsx
"use client";

import { useState } from "react";
import type { BallotOption } from "@/lib/types";

interface MultiSelectBallotProps {
  options: BallotOption[];
  maxSelections: number;
  currentSelected: string[] | null;
  onVote: (selected: string[]) => void;
  disabled: boolean;
}

export function MultiSelectBallot({
  options,
  maxSelections,
  currentSelected,
  onVote,
  disabled,
}: MultiSelectBallotProps) {
  const [selected, setSelected] = useState<string[]>(
    () => currentSelected ?? []
  );

  const atMax = selected.length >= maxSelections;

  const hasChanged =
    currentSelected &&
    JSON.stringify([...selected].sort()) !==
      JSON.stringify([...currentSelected].sort());

  function toggleOption(optionId: string) {
    setSelected((prev) => {
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      }
      if (prev.length >= maxSelections) {
        return prev;
      }
      return [...prev, optionId];
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Select up to {maxSelections} option{maxSelections !== 1 ? "s" : ""}.
        </p>
        <span
          className={`text-sm font-medium ${
            atMax ? "text-brand-600" : "text-gray-500"
          }`}
        >
          {selected.length} of {maxSelections} selected
        </span>
      </div>

      <div className="space-y-2">
        {options.map((option) => {
          const isChecked = selected.includes(option.id);
          const isDisabledByMax = !isChecked && atMax;
          return (
            <button
              key={option.id}
              onClick={() => toggleOption(option.id)}
              disabled={disabled || isDisabledByMax}
              className={`flex w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left transition-colors disabled:opacity-50 ${
                isChecked
                  ? "border-brand-500 bg-brand-50 vote-select"
                  : "border-gray-200 bg-white hover:border-brand-300 hover:bg-brand-50"
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                  isChecked
                    ? "border-brand-500 bg-brand-500"
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
                    isChecked ? "text-brand-700" : "text-gray-900"
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
                <span className="ml-auto text-xs font-medium text-brand-600">
                  Selected
                </span>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => onVote(selected)}
        disabled={disabled || selected.length === 0}
        className="w-full rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
      >
        {currentSelected ? "Update Selections" : "Submit Selections"}
      </button>

      {selected.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          Select at least one option.
        </p>
      )}

      {currentSelected && !hasChanged && (
        <p className="text-center text-sm text-green-600">
          These are your current selections.
        </p>
      )}
    </div>
  );
}
