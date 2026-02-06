"use server";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import type { VoteFormat, PrivacyLevel, PassingThreshold } from "@/lib/types";

export interface CreateVoteState {
  error: string | null;
  fieldErrors: Record<string, string>;
}

export async function createVote(
  _prevState: CreateVoteState,
  formData: FormData
): Promise<CreateVoteState> {
  const member = await requireAdmin();

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const format = formData.get("format") as VoteFormat;
  const privacyLevel = formData.get("privacy_level") as PrivacyLevel;
  const quorumPercentage = parseInt(formData.get("quorum_percentage") as string, 10);
  const passingThreshold = formData.get("passing_threshold") as PassingThreshold;
  const customThresholdPercentage = formData.get("custom_threshold_percentage")
    ? parseInt(formData.get("custom_threshold_percentage") as string, 10)
    : null;
  const deadlineStr = (formData.get("deadline") as string) || null;

  // Parse options from dynamic fields
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
  if (isNaN(quorumPercentage) || quorumPercentage < 0 || quorumPercentage > 100) {
    fieldErrors.quorum_percentage = "Quorum must be between 0 and 100.";
  }
  if (!passingThreshold) fieldErrors.passing_threshold = "Passing threshold is required.";
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
    // Auto-populate
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

  const { data: vote, error: voteError } = await adminClient
    .from("votes")
    .insert({
      title,
      description,
      format,
      privacy_level: privacyLevel,
      status: "draft",
      quorum_percentage: quorumPercentage,
      passing_threshold: passingThreshold,
      custom_threshold_percentage:
        passingThreshold === "custom" ? customThresholdPercentage : null,
      deadline: deadlineStr ? new Date(deadlineStr).toISOString() : null,
      created_by: member.id,
    })
    .select("id")
    .single();

  if (voteError || !vote) {
    return {
      error: `Failed to create vote: ${voteError?.message || "Unknown error"}`,
      fieldErrors: {},
    };
  }

  const optionsToInsert =
    format === "yes_no"
      ? [
          { vote_id: vote.id, label: "Yes", display_order: 0 },
          { vote_id: vote.id, label: "No", display_order: 1 },
        ]
      : options.map((opt, idx) => ({
          vote_id: vote.id,
          label: opt.label,
          description: opt.description,
          display_order: idx,
        }));

  const { error: optionsError } = await adminClient
    .from("vote_options")
    .insert(optionsToInsert);

  if (optionsError) {
    await adminClient.from("votes").delete().eq("id", vote.id);
    return {
      error: `Failed to create vote options: ${optionsError.message}`,
      fieldErrors: {},
    };
  }

  redirect(`/votes/${vote.id}`);
}
