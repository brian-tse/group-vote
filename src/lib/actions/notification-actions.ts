import { createAdminClient } from "@/lib/supabase/admin";
import { sendBulkEmail } from "@/lib/email";
import { voteOpenedEmail, resultsPublishedEmail, reminderEmail } from "@/lib/email-templates";

/**
 * Send "vote opened" email to members in the vote's division (or all for corp-wide).
 */
export async function notifyVoteOpened(
  voteId: string,
  voteTitle: string,
  deadline: string | null,
  divisionId: string | null
): Promise<void> {
  const adminClient = createAdminClient();

  const query = adminClient
    .from("members")
    .select("email")
    .eq("active", true);

  const scopedQuery = divisionId !== null
    ? query.eq("division_id", divisionId)
    : query;

  const { data: members } = await scopedQuery;

  if (!members || members.length === 0) return;

  const emails = members.map((m: { email: string }) => m.email);
  const template = voteOpenedEmail(voteTitle, voteId, deadline);

  await sendBulkEmail(emails, template.subject, template.bodyHtml);
}

/**
 * Send "results published" email to members in the vote's division (or all for corp-wide).
 */
export async function notifyResultsPublished(
  voteId: string,
  voteTitle: string,
  resultSummary: string,
  divisionId: string | null
): Promise<void> {
  const adminClient = createAdminClient();

  const query = adminClient
    .from("members")
    .select("email")
    .eq("active", true);

  const scopedQuery = divisionId !== null
    ? query.eq("division_id", divisionId)
    : query;

  const { data: members } = await scopedQuery;

  if (!members || members.length === 0) return;

  const emails = members.map((m: { email: string }) => m.email);
  const template = resultsPublishedEmail(voteTitle, voteId, resultSummary);

  await sendBulkEmail(emails, template.subject, template.bodyHtml);
}

/**
 * Send a reminder email to non-voters for a specific vote,
 * scoped to the vote's division (or all for corp-wide).
 */
export async function sendReminderToNonVoters(
  voteId: string,
  voteTitle: string,
  deadline: string | null,
  urgency: "halfway" | "24h" | "2h" | "manual",
  divisionId: string | null
): Promise<{ sent: number; failed: number }> {
  const adminClient = createAdminClient();

  // Get active members scoped to division
  const query = adminClient
    .from("members")
    .select("id, email")
    .eq("active", true);

  const scopedQuery = divisionId !== null
    ? query.eq("division_id", divisionId)
    : query;

  const { data: allMembers } = await scopedQuery;

  if (!allMembers || allMembers.length === 0) {
    return { sent: 0, failed: 0 };
  }

  // Get members who have already voted
  const { data: participation } = await adminClient
    .from("participation_records")
    .select("member_id")
    .eq("vote_id", voteId);

  const votedMemberIds = new Set(
    (participation || []).map((p: { member_id: string }) => p.member_id)
  );

  // Filter to non-voters only
  const nonVoterEmails = allMembers
    .filter((m: { id: string }) => !votedMemberIds.has(m.id))
    .map((m: { email: string }) => m.email);

  if (nonVoterEmails.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const template = reminderEmail(voteTitle, voteId, deadline, urgency);

  return sendBulkEmail(nonVoterEmails, template.subject, template.bodyHtml);
}
