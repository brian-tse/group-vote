"use server";

import { getCurrentMember } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { VoteFormat, PrivacyLevel, PassingThreshold } from "@/lib/types";

export interface ProposeVoteState {
  error: string | null;
  fieldErrors: Record<string, string>;
}

// Formats that use standard option_label_N fields
const STANDARD_OPTION_FORMATS: VoteFormat[] = [
  "multiple_choice",
  "ranked_choice",
  "approval",
  "score_rating",
  "multi_select",
];

export async function proposeVote(
  _prevState: ProposeVoteState,
  formData: FormData
): Promise<ProposeVoteState> {
  const member = await getCurrentMember();

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const format = formData.get("format") as VoteFormat;
  const privacyLevel = formData.get("privacy_level") as PrivacyLevel;
  const quorumPercentage = parseInt(
    formData.get("quorum_percentage") as string,
    10
  );
  const passingThreshold = formData.get("passing_threshold") as PassingThreshold;
  const customThresholdPercentage = formData.get("custom_threshold_percentage")
    ? parseInt(formData.get("custom_threshold_percentage") as string, 10)
    : null;

  // Parse standard text options
  const options: { label: string; description: string | null }[] = [];
  if (STANDARD_OPTION_FORMATS.includes(format)) {
    let i = 0;
    while (formData.has(`option_label_${i}`)) {
      const label = (formData.get(`option_label_${i}`) as string)?.trim();
      const optDesc =
        (formData.get(`option_description_${i}`) as string)?.trim() || null;
      if (label) {
        options.push({ label, description: optDesc });
      }
      i++;
    }
  }

  // Parse date options for date_poll
  const dateOptions: string[] = [];
  if (format === "date_poll") {
    let i = 0;
    while (formData.has(`option_date_${i}`)) {
      const dateVal = (formData.get(`option_date_${i}`) as string)?.trim();
      if (dateVal) {
        dateOptions.push(dateVal);
      }
      i++;
    }
  }

  // Parse max_selections for multi_select
  const maxSelectionsStr = formData.get("max_selections") as string | null;
  const maxSelections = maxSelectionsStr ? parseInt(maxSelectionsStr, 10) : 3;

  // Validation
  const fieldErrors: Record<string, string> = {};

  if (!title) fieldErrors.title = "Title is required.";
  if (!format) fieldErrors.format = "Vote format is required.";
  if (!privacyLevel) fieldErrors.privacy_level = "Privacy level is required.";
  if (
    isNaN(quorumPercentage) ||
    quorumPercentage < 0 ||
    quorumPercentage > 100
  ) {
    fieldErrors.quorum_percentage = "Quorum must be between 0 and 100.";
  }
  if (!passingThreshold)
    fieldErrors.passing_threshold = "Passing threshold is required.";
  if (
    passingThreshold === "custom" &&
    (customThresholdPercentage === null ||
      customThresholdPercentage <= 0 ||
      customThresholdPercentage > 100)
  ) {
    fieldErrors.custom_threshold_percentage =
      "Custom threshold must be between 1 and 100.";
  }

  // Format-specific option validation
  if (format === "yes_no" || format === "rsvp") {
    // Auto-populated — no user options needed
  } else if (format === "date_poll") {
    if (dateOptions.length < 2) {
      fieldErrors.options = "At least 2 date/time options are required.";
    }
  } else if (options.length < 2) {
    fieldErrors.options = "At least 2 options are required.";
  }

  if (format === "ranked_choice" && options.length < 3) {
    fieldErrors.options = "Ranked choice requires at least 3 options.";
  }

  if (format === "multi_select" && (isNaN(maxSelections) || maxSelections < 1)) {
    fieldErrors.max_selections = "Maximum selections must be at least 1.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the errors below.", fieldErrors };
  }

  const adminClient = createAdminClient();

  // Build the options JSON for storage in the proposal
  let optionsJson: string;
  if (format === "yes_no" || format === "rsvp") {
    optionsJson = JSON.stringify([]);
  } else if (format === "date_poll") {
    optionsJson = JSON.stringify(
      dateOptions.map((dateVal) => ({ label: dateVal, description: null }))
    );
  } else if (format === "multi_select") {
    // Include max_selections metadata in the options JSON
    optionsJson = JSON.stringify({
      max_selections: maxSelections,
      items: options,
    });
  } else {
    optionsJson = JSON.stringify(options);
  }

  const { error } = await adminClient.from("vote_proposals").insert({
    proposed_by: member.id,
    title,
    description,
    format,
    privacy_level: privacyLevel,
    options: optionsJson,
    quorum_percentage: quorumPercentage,
    passing_threshold: passingThreshold,
    custom_threshold_percentage:
      passingThreshold === "custom" ? customThresholdPercentage : null,
    status: "pending",
  });

  if (error) {
    return {
      error: `Failed to submit proposal: ${error.message}`,
      fieldErrors: {},
    };
  }

  redirect("/dashboard");
}
