"use server";

import { getCurrentMember } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type CommentActionResult = { error?: string };

export async function addComment(
  voteId: string,
  body: string,
  parentId?: string
): Promise<CommentActionResult> {
  const member = await getCurrentMember();
  const adminClient = createAdminClient();

  const trimmed = body.trim();
  if (trimmed.length < 1 || trimmed.length > 2000) {
    return { error: "Comment must be between 1 and 2000 characters." };
  }

  // Verify the vote is open
  const { data: vote, error: voteError } = await adminClient
    .from("votes")
    .select("id, status")
    .eq("id", voteId)
    .single();

  if (voteError || !vote) {
    return { error: "Vote not found." };
  }

  if (vote.status !== "open") {
    return { error: "Comments can only be added to open votes." };
  }

  // If parentId refers to a reply, auto-resolve to the root comment
  let resolvedParentId: string | null = parentId ?? null;
  if (resolvedParentId) {
    const { data: parentComment, error: parentError } = await adminClient
      .from("vote_comments")
      .select("id, parent_id")
      .eq("id", resolvedParentId)
      .single();

    if (parentError || !parentComment) {
      return { error: "Parent comment not found." };
    }

    // If the parent itself has a parent, point to the root instead
    if (parentComment.parent_id) {
      resolvedParentId = parentComment.parent_id;
    }
  }

  const { error: insertError } = await adminClient
    .from("vote_comments")
    .insert({
      vote_id: voteId,
      member_id: member.id,
      parent_id: resolvedParentId,
      body: trimmed,
    });

  if (insertError) {
    return { error: `Failed to add comment: ${insertError.message}` };
  }

  revalidatePath(`/votes/${voteId}`);
  return {};
}

export async function editComment(
  commentId: string,
  voteId: string,
  body: string
): Promise<CommentActionResult> {
  const member = await getCurrentMember();
  const adminClient = createAdminClient();

  const trimmed = body.trim();
  if (trimmed.length < 1 || trimmed.length > 2000) {
    return { error: "Comment must be between 1 and 2000 characters." };
  }

  // Verify ownership
  const { data: comment, error: fetchError } = await adminClient
    .from("vote_comments")
    .select("id, member_id")
    .eq("id", commentId)
    .single();

  if (fetchError || !comment) {
    return { error: "Comment not found." };
  }

  if (comment.member_id !== member.id) {
    return { error: "You can only edit your own comments." };
  }

  const { error: updateError } = await adminClient
    .from("vote_comments")
    .update({ body: trimmed })
    .eq("id", commentId);

  if (updateError) {
    return { error: `Failed to update comment: ${updateError.message}` };
  }

  revalidatePath(`/votes/${voteId}`);
  return {};
}

export async function deleteComment(
  commentId: string,
  voteId: string
): Promise<CommentActionResult> {
  const member = await getCurrentMember();
  const adminClient = createAdminClient();

  // Verify ownership or admin role
  const { data: comment, error: fetchError } = await adminClient
    .from("vote_comments")
    .select("id, member_id")
    .eq("id", commentId)
    .single();

  if (fetchError || !comment) {
    return { error: "Comment not found." };
  }

  if (comment.member_id !== member.id && member.role !== "admin") {
    return { error: "You can only delete your own comments." };
  }

  const { error: deleteError } = await adminClient
    .from("vote_comments")
    .delete()
    .eq("id", commentId);

  if (deleteError) {
    return { error: `Failed to delete comment: ${deleteError.message}` };
  }

  revalidatePath(`/votes/${voteId}`);
  return {};
}
