"use client";

import { useActionState, useState } from "react";
import { createVote, type CreateVoteState } from "./actions";
import {
  VOTE_FORMAT_LABELS,
  PRIVACY_LEVEL_LABELS,
  PASSING_THRESHOLD_LABELS,
  QUORUM_DEFAULT,
} from "@/lib/constants";
import type { VoteFormat } from "@/lib/types";

const initialState: CreateVoteState = { error: null, fieldErrors: {} };

// Formats that show standard text option inputs
const FORMATS_WITH_OPTIONS: VoteFormat[] = [
  "multiple_choice",
  "ranked_choice",
  "approval",
  "score_rating",
  "multi_select",
];

export function VoteForm() {
  const [state, formAction, isPending] = useActionState(createVote, initialState);
  const [format, setFormat] = useState<VoteFormat>("yes_no");
  const [showCustomThreshold, setShowCustomThreshold] = useState(false);
  const [options, setOptions] = useState([
    { label: "", description: "" },
    { label: "", description: "" },
  ]);
  const [dateOptions, setDateOptions] = useState(["", ""]);
  const [maxSelections, setMaxSelections] = useState(3);

  function addOption() {
    setOptions([...options, { label: "", description: "" }]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  }

  function addDateOption() {
    setDateOptions([...dateOptions, ""]);
  }

  function removeDateOption(index: number) {
    if (dateOptions.length <= 2) return;
    setDateOptions(dateOptions.filter((_, i) => i !== index));
  }

  const showOptions = FORMATS_WITH_OPTIONS.includes(format);
  const showDateOptions = format === "date_poll";
  const isRsvp = format === "rsvp";
  const showQuorumThreshold = !isRsvp;

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g., Approve 2026 call schedule policy"
        />
        {state.fieldErrors.title && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Provide context for voters..."
        />
      </div>

      <div>
        <label htmlFor="format" className="block text-sm font-medium text-gray-700">
          Vote Format *
        </label>
        <select
          id="format"
          name="format"
          value={format}
          onChange={(e) => setFormat(e.target.value as VoteFormat)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {Object.entries(VOTE_FORMAT_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {state.fieldErrors.format && (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.format}</p>
        )}
      </div>

      {/* RSVP hint — no options needed */}
      {isRsvp && (
        <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
          RSVP options (Going, Not Going, Maybe) will be created automatically.
        </div>
      )}

      {/* Max selections for multi_select — shown above options */}
      {format === "multi_select" && (
        <div>
          <label
            htmlFor="max_selections"
            className="block text-sm font-medium text-gray-700"
          >
            Maximum Selections *
          </label>
          <input
            id="max_selections"
            name="max_selections"
            type="number"
            min={1}
            value={maxSelections}
            onChange={(e) => setMaxSelections(parseInt(e.target.value, 10) || 1)}
            className="mt-1 block w-32 rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            How many options each voter can select.
          </p>
          {state.fieldErrors.max_selections && (
            <p className="mt-1 text-sm text-red-600">
              {state.fieldErrors.max_selections}
            </p>
          )}
        </div>
      )}

      {/* Standard text options: multiple_choice, ranked_choice, approval, score_rating, multi_select */}
      {showOptions && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Options *
          </label>
          <div className="mt-2 space-y-3">
            {options.map((opt, idx) => (
              <div key={idx} className="flex gap-2">
                <div className="flex-1">
                  <input
                    name={`option_label_${idx}`}
                    type="text"
                    required
                    placeholder={`Option ${idx + 1}`}
                    defaultValue={opt.label}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex-1">
                  <input
                    name={`option_description_${idx}`}
                    type="text"
                    placeholder="Description (optional)"
                    defaultValue={opt.description}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            + Add option
          </button>
          {state.fieldErrors.options && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.options}</p>
          )}
        </div>
      )}

      {/* Date/time options for date_poll */}
      {showDateOptions && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Date/Time Options *
          </label>
          <div className="mt-2 space-y-3">
            {dateOptions.map((dt, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-1">
                    Date/Time option {idx + 1}
                  </label>
                  <input
                    name={`option_date_${idx}`}
                    type="datetime-local"
                    required
                    defaultValue={dt}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {dateOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeDateOption(idx)}
                    className="rounded-lg px-2 py-2 text-sm text-red-600 hover:bg-red-50 self-end"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addDateOption}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            + Add date/time option
          </button>
          {state.fieldErrors.options && (
            <p className="mt-1 text-sm text-red-600">{state.fieldErrors.options}</p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="privacy_level" className="block text-sm font-medium text-gray-700">
          Privacy Level *
        </label>
        <select
          id="privacy_level"
          name="privacy_level"
          defaultValue="anonymous"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {Object.entries(PRIVACY_LEVEL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Anonymous: no one can see who voted how. Admin-Visible: only admin sees
          individual votes. Open: everyone sees.
        </p>
      </div>

      {/* Quorum and threshold — hidden with defaults for RSVP */}
      {showQuorumThreshold ? (
        <>
          <div>
            <label htmlFor="quorum_percentage" className="block text-sm font-medium text-gray-700">
              Quorum (% of members who must vote) *
            </label>
            <input
              id="quorum_percentage"
              name="quorum_percentage"
              type="number"
              min={0}
              max={100}
              defaultValue={QUORUM_DEFAULT}
              className="mt-1 block w-32 rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {state.fieldErrors.quorum_percentage && (
              <p className="mt-1 text-sm text-red-600">
                {state.fieldErrors.quorum_percentage}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="passing_threshold"
              className="block text-sm font-medium text-gray-700"
            >
              Passing Threshold *
            </label>
            <select
              id="passing_threshold"
              name="passing_threshold"
              defaultValue="simple_majority"
              onChange={(e) =>
                setShowCustomThreshold(e.target.value === "custom")
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {Object.entries(PASSING_THRESHOLD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {state.fieldErrors.passing_threshold && (
              <p className="mt-1 text-sm text-red-600">
                {state.fieldErrors.passing_threshold}
              </p>
            )}
          </div>

          {showCustomThreshold && (
            <div>
              <label
                htmlFor="custom_threshold_percentage"
                className="block text-sm font-medium text-gray-700"
              >
                Custom Threshold (%) *
              </label>
              <input
                id="custom_threshold_percentage"
                name="custom_threshold_percentage"
                type="number"
                min={1}
                max={100}
                required
                className="mt-1 block w-32 rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {state.fieldErrors.custom_threshold_percentage && (
                <p className="mt-1 text-sm text-red-600">
                  {state.fieldErrors.custom_threshold_percentage}
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Hidden defaults for RSVP */}
          <input type="hidden" name="quorum_percentage" value={0} />
          <input type="hidden" name="passing_threshold" value="simple_majority" />
        </>
      )}

      <div>
        <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
          Deadline (optional)
        </label>
        <input
          id="deadline"
          name="deadline"
          type="datetime-local"
          className="mt-1 block w-64 rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Leave blank for open-ended votes (admin closes manually).
        </p>
      </div>

      <div className="flex gap-3 border-t pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Create Vote"}
        </button>
        <a
          href="/admin/votes"
          className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
