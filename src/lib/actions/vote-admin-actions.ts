"use server";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Open a vote — changes status from draft to open and records the opened_at timestamp.
 */
export async function openVote(voteId: string): Promise<void> {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { data: vote, error: fetchError } = await adminClient
    .from("votes")
    .select("id, status")
    .eq("id", voteId)
    .single();

  if (fetchError || !vote) {
    throw new Error("Vote not found.");
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

  revalidatePath(`/votes/${voteId}`);
  revalidatePath("/admin/votes");
  revalidatePath("/dashboard");
}

/**
 * Manually close a vote — changes status from open to closed.
 */
export async function closeVote(voteId: string): Promise<void> {
  await requireAdmin();
  const adminClient = createAdminClient();

  const { data: vote, error: fetchError } = await adminClient
    .from("votes")
    .select("id, status")
    .eq("id", voteId)
    .single();

  if (fetchError || !vote) {
    throw new Error("Vote not found.");
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

  revalidatePath(`/votes/${voteId}`);
  revalidatePath("/admin/votes");
  revalidatePath("/dashboard");
}
