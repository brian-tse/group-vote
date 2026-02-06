"use client";

import { useState } from "react";

const VOTE_TYPE_DESCRIPTIONS = [
  {
    name: "Yes / No",
    description: "A simple up-or-down vote on a single question.",
    example: "\"Approve the 2026 call schedule policy\"",
  },
  {
    name: "Multiple Choice",
    description: "Pick one option from a list. The option with the most votes wins.",
    example: "\"Where should we hold the holiday party?\" — Option A, B, or C",
  },
  {
    name: "Ranked Choice",
    description:
      "Rank all options in order of preference. If no option gets a majority, the lowest-ranked option is eliminated and those votes are redistributed until a winner emerges.",
    example: "\"Elect next department chair\" — rank candidates 1st, 2nd, 3rd",
  },
  {
    name: "Date Poll",
    description:
      "Propose several dates (with or without times) and each member responds Yes, Maybe, or No for each date. The date with the most Yes responses wins.",
    example: "\"When should we schedule the Q3 retreat?\" — pick from 5 date options",
  },
  {
    name: "Approval Voting",
    description:
      "Members can approve as many options as they like. The option with the most approvals wins.",
    example: "\"Which CME topics interest you?\" — check all that apply",
  },
  {
    name: "RSVP / Attendance",
    description:
      "Members respond Going, Not Going, or Maybe. No quorum or threshold — just a headcount.",
    example: "\"Annual dinner — December 14th\"",
  },
  {
    name: "Score / Rating",
    description:
      "Rate each option from 1 to 5 stars. The option with the highest average score wins.",
    example: "\"Rate these three vendor proposals\" — star each one",
  },
  {
    name: "Multi-Select (Pick N)",
    description:
      "Select up to N options from a list. The option with the most selections wins.",
    example: "\"Choose your top 3 preferred on-call weekends\" — pick up to 3",
  },
];

export function VoteTypeHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-400 hover:border-brand-500 hover:text-brand-500"
        aria-label="Learn about vote types"
      >
        ?
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-7 z-50 w-96 rounded-lg border bg-white p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                Vote Types Explained
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {VOTE_TYPE_DESCRIPTIONS.map((type) => (
                <div key={type.name}>
                  <div className="text-sm font-medium text-gray-900">
                    {type.name}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-600">
                    {type.description}
                  </p>
                  <p className="mt-0.5 text-xs italic text-gray-400">
                    e.g. {type.example}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
