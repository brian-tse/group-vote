// src/components/ballot/date-poll-ballot.tsx
"use client";

import { useState } from "react";
import type { BallotOption } from "@/lib/types";

interface DatePollBallotProps {
  options: BallotOption[];
  currentResponses: Record<string, string> | null;
  onVote: (responses: Record<string, string>) => void;
  disabled: boolean;
}

const responseConfig = {
  yes: {
    label: "Yes",
    activeClass: "border-green-600 bg-green-50 text-green-700",
    hoverClass: "hover:border-green-300 hover:bg-green-50",
  },
  no: {
    label: "No",
    activeClass: "border-red-600 bg-red-50 text-red-700",
    hoverClass: "hover:border-red-300 hover:bg-red-50",
  },
  maybe: {
    label: "Maybe",
    activeClass: "border-yellow-500 bg-yellow-50 text-yellow-700",
    hoverClass: "hover:border-yellow-300 hover:bg-yellow-50",
  },
} as const;

type ResponseValue = keyof typeof responseConfig;

function formatDateLabel(label: string): string {
  // If it contains "T" or ":", it has a time component
  if (label.includes("T") || label.includes(":")) {
    const d = new Date(label);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  }
  // Date only (e.g., "2026-03-15")
  const d = new Date(label + "T00:00:00");
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  return label;
}

export function DatePollBallot({
  options,
  currentResponses,
  onVote,
  disabled,
}: DatePollBallotProps) {
  const [responses, setResponses] = useState<Record<string, string>>(
    () => currentResponses ?? {}
  );

  const allAnswered = options.every((opt) => responses[opt.id]);

  const hasChanged =
    currentResponses &&
    JSON.stringify(responses) !== JSON.stringify(currentResponses);

  function handleSelect(optionId: string, value: ResponseValue) {
    setResponses((prev) => ({ ...prev, [optionId]: value }));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Indicate your availability for each option.
      </p>

      <div className="space-y-3">
        {options.map((option) => (
          <div
            key={option.id}
            className="rounded-lg border-2 border-gray-200 bg-white px-4 py-3"
          >
            <div className="mb-2">
              <span className="font-medium text-gray-900">{formatDateLabel(option.label)}</span>
              {option.description && (
                <p className="mt-0.5 text-sm text-gray-500">
                  {option.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {(Object.entries(responseConfig) as [ResponseValue, typeof responseConfig[ResponseValue]][]).map(
                ([value, config]) => (
                  <button
                    key={value}
                    onClick={() => handleSelect(option.id, value)}
                    disabled={disabled}
                    className={`flex-1 rounded-md border-2 px-3 py-1.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                      responses[option.id] === value
                        ? config.activeClass
                        : `border-gray-200 text-gray-600 ${config.hoverClass}`
                    }`}
                  >
                    {config.label}
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onVote(responses)}
        disabled={disabled || !allAnswered}
        className="w-full rounded-lg bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
      >
        {currentResponses ? "Update Availability" : "Submit Availability"}
      </button>

      {!allAnswered && (
        <p className="text-center text-sm text-gray-500">
          Please respond to all options before submitting.
        </p>
      )}

      {currentResponses && !hasChanged && (
        <p className="text-center text-sm text-green-600">
          This is your current availability.
        </p>
      )}
    </div>
  );
}
