// src/components/ballot/rsvp-ballot.tsx
"use client";

interface RsvpBallotProps {
  currentResponse: string | null;
  onVote: (response: string) => void;
  disabled: boolean;
}

const rsvpOptions = [
  {
    value: "going",
    label: "Going",
    activeClass: "border-green-600 bg-green-50 text-green-700",
    hoverClass: "hover:border-green-300 hover:bg-green-50",
  },
  {
    value: "not_going",
    label: "Not Going",
    activeClass: "border-red-600 bg-red-50 text-red-700",
    hoverClass: "hover:border-red-300 hover:bg-red-50",
  },
  {
    value: "maybe",
    label: "Maybe",
    activeClass: "border-yellow-500 bg-yellow-50 text-yellow-700",
    hoverClass: "hover:border-yellow-300 hover:bg-yellow-50",
  },
] as const;

export function RsvpBallot({
  currentResponse,
  onVote,
  disabled,
}: RsvpBallotProps) {
  return (
    <div className="flex gap-4">
      {rsvpOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onVote(option.value)}
          disabled={disabled}
          className={`flex-1 rounded-lg border-2 px-6 py-4 text-lg font-semibold transition-colors disabled:opacity-50 ${
            currentResponse === option.value
              ? option.activeClass
              : `border-gray-200 bg-white text-gray-700 ${option.hoverClass}`
          }`}
        >
          {option.label}
          {currentResponse === option.value && (
            <span className="ml-2 text-sm font-normal">(your response)</span>
          )}
        </button>
      ))}
    </div>
  );
}
