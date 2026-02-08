"use server";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function approveProposal(proposalId: string) {
  const admin = await requireAdmin();
  const adminClient = createAdminClient();

  // Fetch the proposal
  const { data: proposal, error: fetchError } = await adminClient
    .from("vote_proposals")
    .select("*")
    .eq("id", proposalId)
    .single();

  if (fetchError || !proposal) {
    throw new Error(
      `Failed to fetch proposal: ${fetchError?.message || "Not found"}`
    );
  }

  if (proposal.status !== "pending") {
    throw new Error("This proposal has already been reviewed.");
  }

  // Parse options from the proposal JSON
  const proposalOptions = (() => {
    try {
      return typeof proposal.options === "string"
        ? JSON.parse(proposal.options)
        : proposal.options;
    } catch {
      return [];
    }
  })();

  // Create the vote from proposal data
  const { data: vote, error: voteError } = await adminClient
    .from("votes")
    .insert({
      title: proposal.title,
      description: proposal.description,
      format: proposal.format,
      privacy_level: proposal.privacy_level,
      status: "draft",
      quorum_percentage: proposal.quorum_percentage,
      passing_threshold: proposal.passing_threshold,
      custom_threshold_percentage: proposal.custom_threshold_percentage,
      division_id: proposal.division_id,
      created_by: admin.id,
    })
    .select("id")
    .single();

  if (voteError || !vote) {
    throw new Error(
      `Failed to create vote from proposal: ${voteError?.message || "Unknown error"}`
    );
  }

  // Insert vote options
  const optionsToInsert =
    proposal.format === "yes_no"
      ? [
          { vote_id: vote.id, label: "Yes", display_order: 0 },
          { vote_id: vote.id, label: "No", display_order: 1 },
        ]
      : proposalOptions.map(
          (
            opt: { label: string; description: string | null },
            idx: number
          ) => ({
            vote_id: vote.id,
            label: opt.label,
            description: opt.description,
            display_order: idx,
          })
        );

  const { error: optionsError } = await adminClient
    .from("vote_options")
    .insert(optionsToInsert);

  if (optionsError) {
    // Clean up the vote if options failed
    await adminClient.from("votes").delete().eq("id", vote.id);
    throw new Error(
      `Failed to create vote options: ${optionsError.message}`
    );
  }

  // Mark proposal as approved
  const { error: updateError } = await adminClient
    .from("vote_proposals")
    .update({
      status: "approved",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", proposalId);

  if (updateError) {
    throw new Error(
      `Vote created but failed to update proposal status: ${updateError.message}`
    );
  }

  revalidatePath("/admin/proposals");
  revalidatePath("/admin/votes");
}

export async function rejectProposal(
  proposalId: string,
  adminNotes: string | null
) {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("vote_proposals")
    .update({
      status: "rejected",
      admin_notes: adminNotes,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", proposalId);

  if (error) {
    throw new Error(`Failed to reject proposal: ${error.message}`);
  }

  revalidatePath("/admin/proposals");
}
