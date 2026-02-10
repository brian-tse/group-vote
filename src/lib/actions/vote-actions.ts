// src/lib/actions/vote-actions.ts
"use server";

import { getCurrentMember } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { PrivacyLevel } from "@/lib/types";

export type VoteChoice =
  | { option_id: string }           // yes_no, multiple_choice
  | { ranked: string[] }            // ranked_choice
  | { responses: Record<string, string> }  // date_poll
  | { approved: string[] }          // approval
  | { response: string }            // rsvp
  | { scores: Record<string, number> }     // score_rating
  | { selected: string[] };         // multi_select

export type VoteActionResult = { error?: string };

interface CastVoteInput {
  voteId: string;
  choice: VoteChoice;
  privacyLevel: PrivacyLevel;
}

interface ChangeVoteInput extends CastVoteInput {
  sessionToken: string | null;
}

export async function castVote(input: CastVoteInput): Promise<VoteActionResult> {
  const member = await getCurrentMember();
  const adminClient = createAdminClient();

  if (member.observer) {
    return { error: "Observers cannot vote." };
  }

  // Verify the vote is open
  const { data: vote, error: voteError } = await adminClient
    .from("votes")
    .select("id, status, privacy_level")
    .eq("id", input.voteId)
    .single();

  if (voteError || !vote) {
    return { error: "Vote not found." };
  }

  if (vote.status !== "open") {
    return { error: "This vote is not currently open." };
  }

  // Check member hasn't already voted
  const { data: existing } = await adminClient
    .from("participation_records")
    .select("id")
    .eq("vote_id", input.voteId)
    .eq("member_id", member.id)
    .single();

  if (existing) {
    return { error: "You have already voted. Use the change vote option instead." };
  }

  if (input.privacyLevel === "anonymous") {
    // --- ANONYMOUS VOTE: two separate inserts ---

    // 1. Insert participation record (WHO voted — no choice info)
    const { error: partError } = await adminClient
      .from("participation_records")
      .insert({
        vote_id: input.voteId,
        member_id: member.id,
      });

    if (partError) {
      return { error: `Failed to record participation: ${partError.message}` };
    }

    // 2. Insert anonymous ballot (WHAT was chosen — no member info)
    const { data: ballot, error: ballotError } = await adminClient
      .from("ballot_records_anonymous")
      .insert({
        vote_id: input.voteId,
        choice: input.choice,
        voting_member: member.voting_member,
      })
      .select("id")
      .single();

    if (ballotError) {
      // Roll back participation if ballot failed
      await adminClient
        .from("participation_records")
        .delete()
        .eq("vote_id", input.voteId)
        .eq("member_id", member.id);
      return { error: `Failed to cast ballot: ${ballotError.message}` };
    }

    // 3. Store ballot ID in a cookie so the member can change their vote later.
    const cookieStore = await cookies();
    cookieStore.set(
      `ballot_token_${input.voteId}`,
      ballot.id,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 90, // 90 days
        path: "/",
      }
    );
  } else {
    // --- NON-ANONYMOUS VOTE: single insert with member_id ---

    // 1. Insert named ballot
    const { error: ballotError } = await adminClient
      .from("ballot_records_named")
      .insert({
        vote_id: input.voteId,
        member_id: member.id,
        choice: input.choice,
      });

    if (ballotError) {
      return { error: `Failed to cast ballot: ${ballotError.message}` };
    }

    // 2. Insert participation record
    const { error: partError } = await adminClient
      .from("participation_records")
      .insert({
        vote_id: input.voteId,
        member_id: member.id,
      });

    if (partError) {
      // Ballot was cast — log but don't fail. Participation is secondary.
      console.error(
        `Failed to record participation for named vote: ${partError.message}`
      );
    }
  }

  revalidatePath(`/votes/${input.voteId}`);
  return {};
}

export async function changeVote(input: ChangeVoteInput): Promise<VoteActionResult> {
  const member = await getCurrentMember();
  const adminClient = createAdminClient();

  if (member.observer) {
    return { error: "Observers cannot vote." };
  }

  // Verify the vote is open
  const { data: vote, error: voteError } = await adminClient
    .from("votes")
    .select("id, status, privacy_level")
    .eq("id", input.voteId)
    .single();

  if (voteError || !vote) {
    return { error: "Vote not found." };
  }

  if (vote.status !== "open") {
    return { error: "This vote is closed — you can no longer change your vote." };
  }

  if (input.privacyLevel === "anonymous") {
    // --- ANONYMOUS VOTE CHANGE ---

    // Retrieve the ballot ID from the cookie
    const cookieStore = await cookies();
    const ballotId = cookieStore.get(`ballot_token_${input.voteId}`)?.value;

    if (!ballotId) {
      return {
        error:
          "Unable to identify your previous anonymous ballot. " +
          "This can happen if you cleared your cookies or are using a different browser.",
      };
    }

    // Verify the old ballot exists
    const { data: oldBallot } = await adminClient
      .from("ballot_records_anonymous")
      .select("id")
      .eq("id", ballotId)
      .eq("vote_id", input.voteId)
      .single();

    if (!oldBallot) {
      return { error: "Previous ballot not found. It may have already been removed." };
    }

    // Delete the old anonymous ballot
    const { error: deleteError } = await adminClient
      .from("ballot_records_anonymous")
      .delete()
      .eq("id", ballotId);

    if (deleteError) {
      return { error: `Failed to remove old ballot: ${deleteError.message}` };
    }

    // Insert new anonymous ballot
    const { data: newBallot, error: insertError } = await adminClient
      .from("ballot_records_anonymous")
      .insert({
        vote_id: input.voteId,
        choice: input.choice,
        voting_member: member.voting_member,
      })
      .select("id")
      .single();

    if (insertError) {
      return { error: `Failed to cast new ballot: ${insertError.message}` };
    }

    // Update the cookie with the new ballot ID
    cookieStore.set(
      `ballot_token_${input.voteId}`,
      newBallot.id,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24 * 90,
        path: "/",
      }
    );

    // Update participation timestamp
    await adminClient
      .from("participation_records")
      .update({ updated_at: new Date().toISOString() })
      .eq("vote_id", input.voteId)
      .eq("member_id", member.id);
  } else {
    // --- NON-ANONYMOUS VOTE CHANGE: update in place ---

    const { error: updateError } = await adminClient
      .from("ballot_records_named")
      .update({
        choice: input.choice,
        cast_at: new Date().toISOString(),
      })
      .eq("vote_id", input.voteId)
      .eq("member_id", member.id);

    if (updateError) {
      return { error: `Failed to update vote: ${updateError.message}` };
    }

    // Update participation timestamp
    await adminClient
      .from("participation_records")
      .update({ updated_at: new Date().toISOString() })
      .eq("vote_id", input.voteId)
      .eq("member_id", member.id);
  }

  revalidatePath(`/votes/${input.voteId}`);
  return {};
}
