import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReminderToNonVoters } from "@/lib/actions/notification-actions";

export const runtime = "nodejs";

type ReminderType = "halfway" | "24h" | "2h";

interface ReminderCheck {
  type: ReminderType;
  shouldSend: (openedAt: Date, deadline: Date, now: Date) => boolean;
}

/**
 * Define the reminder windows:
 * - "halfway": when current time has passed the midpoint between opened_at and deadline
 * - "24h": when there are 24 hours or fewer remaining
 * - "2h": when there are 2 hours or fewer remaining
 */
const REMINDER_CHECKS: ReminderCheck[] = [
  {
    type: "halfway",
    shouldSend: (openedAt, deadline, now) => {
      const midpoint = new Date(
        openedAt.getTime() +
          (deadline.getTime() - openedAt.getTime()) / 2
      );
      return now >= midpoint;
    },
  },
  {
    type: "24h",
    shouldSend: (_openedAt, deadline, now) => {
      const hoursRemaining =
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursRemaining <= 24 && hoursRemaining > 0;
    },
  },
  {
    type: "2h",
    shouldSend: (_openedAt, deadline, now) => {
      const hoursRemaining =
        (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursRemaining <= 2 && hoursRemaining > 0;
    },
  },
];

/**
 * Cron job: send automatic reminders for open votes with deadlines.
 * Runs every hour via Vercel Cron.
 *
 * For each open vote with a deadline:
 *   1. Check which reminder windows have been triggered
 *   2. Check which reminders have already been sent (via sent_reminders table)
 *   3. Send any unsent reminders to non-voters
 *   4. Record that the reminder was sent
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
  const now = new Date();

  // Fetch all open votes that have a deadline and an opened_at timestamp
  const { data: openVotes, error: fetchError } = await adminClient
    .from("votes")
    .select("id, title, deadline, opened_at")
    .eq("status", "open")
    .not("deadline", "is", null)
    .not("opened_at", "is", null);

  if (fetchError) {
    console.error(`Failed to fetch open votes: ${fetchError.message}`);
    return NextResponse.json(
      { error: "Failed to fetch open votes" },
      { status: 500 }
    );
  }

  if (!openVotes || openVotes.length === 0) {
    return NextResponse.json({ reminders_sent: 0, details: [] });
  }

  // Fetch all already-sent reminders
  const voteIds = openVotes.map((v: { id: string }) => v.id);
  const { data: existingReminders } = await adminClient
    .from("sent_reminders")
    .select("vote_id, type")
    .in("vote_id", voteIds);

  const sentSet = new Set(
    (existingReminders || []).map(
      (r: { vote_id: string; type: string }) => `${r.vote_id}:${r.type}`
    )
  );

  const details: {
    voteId: string;
    voteTitle: string;
    reminderType: string;
    sent: number;
  }[] = [];

  for (const vote of openVotes) {
    const deadline = new Date(vote.deadline);
    const openedAt = new Date(vote.opened_at);

    // Skip if deadline has already passed (close-votes cron handles that)
    if (deadline <= now) continue;

    for (const check of REMINDER_CHECKS) {
      const key = `${vote.id}:${check.type}`;

      // Skip if already sent
      if (sentSet.has(key)) continue;

      // Check if this reminder window is active
      if (!check.shouldSend(openedAt, deadline, now)) continue;

      // Send the reminder to non-voters
      try {
        const result = await sendReminderToNonVoters(
          vote.id,
          vote.title,
          vote.deadline,
          check.type
        );

        // Record that this reminder was sent
        await adminClient.from("sent_reminders").insert({
          vote_id: vote.id,
          type: check.type,
        });

        details.push({
          voteId: vote.id,
          voteTitle: vote.title,
          reminderType: check.type,
          sent: result.sent,
        });
      } catch (err) {
        console.error(
          `Failed to send ${check.type} reminder for vote "${vote.title}":`,
          err instanceof Error ? err.message : err
        );
      }
    }
  }

  const totalSent = details.reduce((sum, d) => sum + d.sent, 0);

  return NextResponse.json({
    reminders_sent: totalSent,
    details,
  });
}
