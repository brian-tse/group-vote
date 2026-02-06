// src/components/ballot/ballot-wrapper.tsx
"use client";

import { useTransition, useState, useCallback } from "react";
import { castVote, changeVote } from "@/lib/actions/vote-actions";
import { YesNoBallot } from "./yes-no-ballot";
import { MultipleChoiceBallot } from "./multiple-choice-ballot";
import { RankedChoiceBallot } from "./ranked-choice-ballot";
import type { VoteOption, VoteFormat, PrivacyLevel } from "@/lib/types";

interface BallotWrapperProps {
  voteId: string;
  format: VoteFormat;
  privacyLevel: PrivacyLevel;
  options: VoteOption[];
  existingChoice: string | null;
  existingRanking: string[] | null;
  hasVoted: boolean;
  sessionToken: string | null;
}

export function BallotWrapper({
  voteId,
  format,
  privacyLevel,
  options,
  existingChoice,
  existingRanking,
  hasVoted,
  sessionToken,
}: BallotWrapperProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [currentChoice, setCurrentChoice] = useState<string | null>(
    existingChoice
  );
  const [currentRanking, setCurrentRanking] = useState<string[] | null>(
    existingRanking
  );

  const handleVote = useCallback(
    (choice: string | string[]) => {
      setError(null);
      startTransition(async () => {
        try {
          const choicePayload =
            typeof choice === "string"
              ? { option_id: choice }
              : { ranked: choice };

          if (hasVoted) {
            await changeVote({
              voteId,
              choice: choicePayload,
              privacyLevel,
              sessionToken,
            });
          } else {
            await castVote({
              voteId,
              choice: choicePayload,
              privacyLevel,
            });
          }

          // Update local state
          if (typeof choice === "string") {
            setCurrentChoice(choice);
          } else {
            setCurrentRanking(choice);
          }
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to cast vote."
          );
        }
      });
    },
    [voteId, privacyLevel, hasVoted, sessionToken]
  );

  return (
    <div className="space-y-4">
      {hasVoted && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          You have already voted. You can change your vote below.
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {format === "yes_no" && (
        <YesNoBallot
          options={options}
          currentChoice={currentChoice}
          onVote={(optionId) => handleVote(optionId)}
          disabled={isPending}
        />
      )}

      {format === "multiple_choice" && (
        <MultipleChoiceBallot
          options={options}
          currentChoice={currentChoice}
          onVote={(optionId) => handleVote(optionId)}
          disabled={isPending}
        />
      )}

      {format === "ranked_choice" && (
        <RankedChoiceBallot
          options={options}
          currentRanking={currentRanking}
          onVote={(rankedIds) => handleVote(rankedIds)}
          disabled={isPending}
        />
      )}

      {isPending && (
        <p className="text-center text-sm text-gray-500">
          Submitting your vote...
        </p>
      )}
    </div>
  );
}
