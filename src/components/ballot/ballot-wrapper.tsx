// src/components/ballot/ballot-wrapper.tsx
"use client";

import { useTransition, useState, useCallback, useEffect } from "react";
import { castVote, changeVote } from "@/lib/actions/vote-actions";
import type { VoteChoice } from "@/lib/actions/vote-actions";
import { YesNoBallot } from "./yes-no-ballot";
import { MultipleChoiceBallot } from "./multiple-choice-ballot";
import { DatePollBallot } from "./date-poll-ballot";
import { ApprovalBallot } from "./approval-ballot";
import { RsvpBallot } from "./rsvp-ballot";
import { ScoreRatingBallot } from "./score-rating-ballot";
import { MultiSelectBallot } from "./multi-select-ballot";
import type { BallotOption, VoteFormat, PrivacyLevel } from "@/lib/types";

// @dnd-kit uses browser-only APIs — lazy load only on the client
type RankedChoiceBallotProps = {
  options: BallotOption[];
  currentRanking: string[] | null;
  onVote: (rankedOptionIds: string[]) => void;
  disabled: boolean;
};
function LazyRankedChoiceBallot(props: RankedChoiceBallotProps) {
  const [Component, setComponent] = useState<React.ComponentType<RankedChoiceBallotProps> | null>(null);
  useEffect(() => {
    import("./ranked-choice-ballot").then((m) => {
      setComponent(() => m.RankedChoiceBallot);
    });
  }, []);
  if (!Component) return <p className="text-sm text-gray-400">Loading ranked choice ballot...</p>;
  return <Component {...props} />;
}

interface BallotWrapperProps {
  voteId: string;
  format: VoteFormat;
  privacyLevel: PrivacyLevel;
  options: BallotOption[];
  existingChoice: string | null;
  existingRanking: string[] | null;
  existingResponses: Record<string, string> | null;
  existingApproved: string[] | null;
  existingRsvpResponse: string | null;
  existingScores: Record<string, number> | null;
  existingSelected: string[] | null;
  maxSelections?: number;
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
  existingResponses,
  existingApproved,
  existingRsvpResponse,
  existingScores,
  existingSelected,
  maxSelections,
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
  const [currentResponses, setCurrentResponses] = useState<Record<string, string> | null>(
    existingResponses
  );
  const [currentApproved, setCurrentApproved] = useState<string[] | null>(
    existingApproved
  );
  const [currentRsvpResponse, setCurrentRsvpResponse] = useState<string | null>(
    existingRsvpResponse
  );
  const [currentScores, setCurrentScores] = useState<Record<string, number> | null>(
    existingScores
  );
  const [currentSelected, setCurrentSelected] = useState<string[] | null>(
    existingSelected
  );

  const handleVote = useCallback(
    (choice:
      | string
      | string[]
      | { type: "date_poll"; responses: Record<string, string> }
      | { type: "approval"; approved: string[] }
      | { type: "rsvp"; response: string }
      | { type: "score_rating"; scores: Record<string, number> }
      | { type: "multi_select"; selected: string[] }
    ) => {
      setError(null);
      startTransition(async () => {
        try {
          let choicePayload: VoteChoice;

          if (typeof choice === "object" && "type" in choice) {
            // New format types with explicit type discriminator — strip `type` to get VoteChoice
            switch (choice.type) {
              case "date_poll":
                choicePayload = { responses: choice.responses };
                break;
              case "approval":
                choicePayload = { approved: choice.approved };
                break;
              case "rsvp":
                choicePayload = { response: choice.response };
                break;
              case "score_rating":
                choicePayload = { scores: choice.scores };
                break;
              case "multi_select":
                choicePayload = { selected: choice.selected };
                break;
            }
          } else if (typeof choice === "string") {
            choicePayload = { option_id: choice };
          } else if (Array.isArray(choice)) {
            choicePayload = { ranked: choice };
          } else {
            // Exhaustive — should not reach here
            throw new Error("Unrecognized choice format");
          }

          let result;
          if (hasVoted) {
            result = await changeVote({
              voteId,
              choice: choicePayload,
              privacyLevel,
              sessionToken,
            });
          } else {
            result = await castVote({
              voteId,
              choice: choicePayload,
              privacyLevel,
            });
          }

          if (result?.error) {
            setError(result.error);
            return;
          }

          // Update local state based on discriminated type
          if (typeof choice === "object" && "type" in choice) {
            switch (choice.type) {
              case "date_poll":
                setCurrentResponses(choice.responses);
                break;
              case "approval":
                setCurrentApproved(choice.approved);
                break;
              case "rsvp":
                setCurrentRsvpResponse(choice.response);
                break;
              case "score_rating":
                setCurrentScores(choice.scores);
                break;
              case "multi_select":
                setCurrentSelected(choice.selected);
                break;
            }
          } else if (typeof choice === "string") {
            setCurrentChoice(choice);
          } else if (Array.isArray(choice)) {
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

  const optionLabel = (id: string) =>
    options.find((o) => o.id === id)?.label ?? id;

  function getVoteSummary(): string | null {
    if (format === "yes_no" || format === "multiple_choice") {
      if (currentChoice) return optionLabel(currentChoice);
    }
    if (format === "ranked_choice" && currentRanking?.length) {
      return currentRanking.map((id, i) => `${i + 1}. ${optionLabel(id)}`).join(", ");
    }
    if (format === "approval" && currentApproved?.length) {
      return currentApproved.map(optionLabel).join(", ");
    }
    if (format === "multi_select" && currentSelected?.length) {
      return currentSelected.map(optionLabel).join(", ");
    }
    if (format === "rsvp" && currentRsvpResponse) {
      return currentRsvpResponse.charAt(0).toUpperCase() + currentRsvpResponse.slice(1);
    }
    if (format === "date_poll" && currentResponses) {
      return Object.entries(currentResponses)
        .map(([id, response]) => `${optionLabel(id)}: ${response}`)
        .join(", ");
    }
    if (format === "score_rating" && currentScores) {
      return Object.entries(currentScores)
        .map(([id, score]) => `${optionLabel(id)}: ${score}`)
        .join(", ");
    }
    return null;
  }

  const voteSummary = hasVoted ? getVoteSummary() : null;

  return (
    <div className="space-y-4">
      {hasVoted && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          <p>You have already voted. You can change your vote below.</p>
          {voteSummary && (
            <p className="mt-1 font-medium">Your vote: {voteSummary}</p>
          )}
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
        <LazyRankedChoiceBallot
          options={options}
          currentRanking={currentRanking}
          onVote={(rankedIds) => handleVote(rankedIds)}
          disabled={isPending}
        />
      )}

      {format === "date_poll" && (
        <DatePollBallot
          options={options}
          currentResponses={currentResponses}
          onVote={(responses) =>
            handleVote({ type: "date_poll", responses })
          }
          disabled={isPending}
        />
      )}

      {format === "approval" && (
        <ApprovalBallot
          options={options}
          currentApproved={currentApproved}
          onVote={(approved) =>
            handleVote({ type: "approval", approved })
          }
          disabled={isPending}
        />
      )}

      {format === "rsvp" && (
        <RsvpBallot
          currentResponse={currentRsvpResponse}
          onVote={(response) =>
            handleVote({ type: "rsvp", response })
          }
          disabled={isPending}
        />
      )}

      {format === "score_rating" && (
        <ScoreRatingBallot
          options={options}
          currentScores={currentScores}
          onVote={(scores) =>
            handleVote({ type: "score_rating", scores })
          }
          disabled={isPending}
        />
      )}

      {format === "multi_select" && (
        <MultiSelectBallot
          options={options}
          maxSelections={maxSelections ?? options.length}
          currentSelected={currentSelected}
          onVote={(selected) =>
            handleVote({ type: "multi_select", selected })
          }
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
