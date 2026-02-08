"use server";

import { requireAdmin, canAdminVote } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyVoteOpened, notifyResultsPublished } from "./notification-actions";

/**
 * Open a vote — changes status from draft to open and records the opened_at timestamp.
 */
export async function openVote(voteId: string, notify: boolean = true): Promise<void> {
  const member = await requireAdmin();
  const adminClient = createAdminClient();

  const { data: vote, error: fetchError } = await adminClient
    .from("votes")
    .select("id, status, title, deadline, division_id")
    .eq("id", voteId)
    .single();

  if (fetchError || !vote) {
    throw new Error("Vote not found.");
  }

  if (!canAdminVote(member, vote.division_id)) {
    throw new Error("You do not have permission to manage this vote.");
  }

  if (vote.status !== "draft") {
    throw new Error(`Cannot open a vote with status "${vote.status}".`);
  }

  const { error } = await adminClient
    .from("votes")
    .update({
      status: "open",
      opened_at: new Date().toISOString(),
    })
    .eq("id", voteId);

  if (error) {
    throw new Error(`Failed to open vote: ${error.message}`);
  }

  // Notify members in the vote's division (if requested)
  if (notify) {
    await notifyVoteOpened(voteId, vote.title, vote.deadline, vote.division_id).catch((err) =>
      console.error("Failed to send vote opened notifications:", err)
    );
  }

  revalidatePath(`/votes/${voteId}`);
  revalidatePath("/admin/votes");
  revalidatePath("/dashboard");
}

/**
 * Manually close a vote — changes status from open to closed.
 */
export async function closeVote(voteId: string, notify: boolean = true): Promise<void> {
  const member = await requireAdmin();
  const adminClient = createAdminClient();

  const { data: vote, error: fetchError } = await adminClient
    .from("votes")
    .select("id, status, title, division_id")
    .eq("id", voteId)
    .single();

  if (fetchError || !vote) {
    throw new Error("Vote not found.");
  }

  if (!canAdminVote(member, vote.division_id)) {
    throw new Error("You do not have permission to manage this vote.");
  }

  if (vote.status !== "open") {
    throw new Error(`Cannot close a vote with status "${vote.status}".`);
  }

  const { error } = await adminClient
    .from("votes")
    .update({
      status: "closed",
      closed_at: new Date().toISOString(),
    })
    .eq("id", voteId);

  if (error) {
    throw new Error(`Failed to close vote: ${error.message}`);
  }

  // Notify members in the vote's division that results are available (if requested)
  if (notify) {
    await notifyResultsPublished(
      voteId,
      vote.title,
      "The vote has been closed and results are now available.",
      vote.division_id
    ).catch((err) =>
      console.error("Failed to send results published notifications:", err)
    );
  }

  revalidatePath(`/votes/${voteId}`);
  revalidatePath("/admin/votes");
  revalidatePath("/dashboard");
}

/**
 * Delete a vote and all associated data (ballots, participation records).
 */
export async function deleteVote(voteId: string): Promise<void> {
  const member = await requireAdmin();
  const adminClient = createAdminClient();

  const { data: vote, error: fetchError } = await adminClient
    .from("votes")
    .select("id, division_id")
    .eq("id", voteId)
    .single();

  if (fetchError || !vote) {
    throw new Error("Vote not found.");
  }

  if (!canAdminVote(member, vote.division_id)) {
    throw new Error("You do not have permission to manage this vote.");
  }

  // Delete related records first (comments, ballots, participation records, reminders)
  await adminClient.from("vote_comments").delete().eq("vote_id", voteId);
  await adminClient.from("ballots").delete().eq("vote_id", voteId);
  await adminClient.from("participation_records").delete().eq("vote_id", voteId);
  await adminClient.from("sent_reminders").delete().eq("vote_id", voteId);

  const { error } = await adminClient
    .from("votes")
    .delete()
    .eq("id", voteId);

  if (error) {
    throw new Error(`Failed to delete vote: ${error.message}`);
  }

  revalidatePath("/admin/votes");
  revalidatePath("/dashboard");
  redirect("/admin/votes");
}
