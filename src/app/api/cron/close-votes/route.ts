import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Cron job: auto-close votes whose deadline has passed.
 * Runs every 5 minutes via Vercel Cron.
 */
export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    throw new Error("CRON_SECRET environment variable is required");
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  // Find open votes whose deadline has passed
  const { data: expiredVotes, error: fetchError } = await adminClient
    .from("votes")
    .select("id, title")
    .eq("status", "open")
    .not("deadline", "is", null)
    .lte("deadline", now);

  if (fetchError) {
    console.error(`Failed to fetch expired votes: ${fetchError.message}`);
    return NextResponse.json(
      { error: "Failed to fetch expired votes" },
      { status: 500 }
    );
  }

  if (!expiredVotes || expiredVotes.length === 0) {
    return NextResponse.json({ closed: 0 });
  }

  // Close each expired vote
  const closedIds: string[] = [];
  for (const vote of expiredVotes) {
    const { error: updateError } = await adminClient
      .from("votes")
      .update({
        status: "closed",
        closed_at: now,
      })
      .eq("id", vote.id);

    if (updateError) {
      console.error(
        `Failed to close vote "${vote.title}": ${updateError.message}`
      );
    } else {
      closedIds.push(vote.id);
    }
  }

  return NextResponse.json({
    closed: closedIds.length,
    vote_ids: closedIds,
  });
}
