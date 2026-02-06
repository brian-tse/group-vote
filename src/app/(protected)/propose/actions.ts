"use server";

import { getCurrentMember } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { VoteFormat, PrivacyLevel, PassingThreshold } from "@/lib/types";

export interface ProposeVoteState {
  error: string | null;
  fieldErrors: Record<string, string>;
}

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

  // Parse options from dynamic form fields
  const options: { label: string; description: string | null }[] = [];
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

  if (format === "yes_no") {
    // Auto-populate options on approval
  } else if (options.length < 2) {
    fieldErrors.options = "At least 2 options are required.";
  }

  if (format === "ranked_choice" && options.length < 3) {
    fieldErrors.options = "Ranked choice requires at least 3 options.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Please fix the errors below.", fieldErrors };
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient.from("vote_proposals").insert({
    proposed_by: member.id,
    title,
    description,
    format,
    privacy_level: privacyLevel,
    options: format === "yes_no" ? JSON.stringify([]) : JSON.stringify(options),
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
