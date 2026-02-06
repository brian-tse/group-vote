const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Magic link email -- sent when a member requests to log in.
 */
export function magicLinkEmail(magicLinkUrl: string) {
  return {
    subject: "Your Group Vote login link",
    bodyHtml: `
      <h2>Sign in to Group Vote</h2>
      <p>Click the button below to sign in. This link expires in 15 minutes.</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${magicLinkUrl}" class="btn">Sign In</a>
      </p>
      <p style="font-size: 13px; color: #6b7280;">
        If you didn't request this link, you can safely ignore this email.
      </p>
    `,
  };
}

/**
 * Vote opened email -- sent to all members when a vote goes live.
 * Includes a direct link to the ballot page.
 */
export function voteOpenedEmail(voteTitle: string, voteId: string, deadline: string | null) {
  const ballotUrl = `${APP_URL}/votes/${voteId}`;
  const deadlineText = deadline
    ? `The deadline to vote is <strong>${new Date(deadline).toLocaleString()}</strong>.`
    : "This vote has no deadline — the admin will close it manually.";

  return {
    subject: `New vote: ${voteTitle}`,
    bodyHtml: `
      <h2>${voteTitle}</h2>
      <p>A new vote has been opened for the group. ${deadlineText}</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${ballotUrl}" class="btn">Cast Your Vote</a>
      </p>
      <p style="font-size: 13px; color: #6b7280;">
        You can change your vote at any time before it closes.
      </p>
    `,
  };
}

/**
 * Results published email -- sent to all members when a vote closes.
 */
export function resultsPublishedEmail(
  voteTitle: string,
  voteId: string,
  resultSummary: string
) {
  const resultsUrl = `${APP_URL}/votes/${voteId}/results`;

  return {
    subject: `Results: ${voteTitle}`,
    bodyHtml: `
      <h2>Results: ${voteTitle}</h2>
      <p>${resultSummary}</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${resultsUrl}" class="btn">View Full Results</a>
      </p>
    `,
  };
}

/**
 * Reminder email -- sent to non-voters for an open vote.
 */
export function reminderEmail(
  voteTitle: string,
  voteId: string,
  deadline: string | null,
  urgency: "halfway" | "24h" | "2h" | "manual"
) {
  const ballotUrl = `${APP_URL}/votes/${voteId}`;

  const urgencyText: Record<string, string> = {
    halfway: "The voting period is halfway over.",
    "24h": "There are about 24 hours left to vote.",
    "2h": "Voting closes in about 2 hours!",
    manual: "This is a reminder from the group admin.",
  };

  const deadlineText = deadline
    ? `Deadline: <strong>${new Date(deadline).toLocaleString()}</strong>`
    : "";

  return {
    subject: `Reminder: Vote on "${voteTitle}"`,
    bodyHtml: `
      <h2>Don't forget to vote</h2>
      <p>You haven't voted on <strong>${voteTitle}</strong> yet. ${urgencyText[urgency]}</p>
      ${deadlineText ? `<p>${deadlineText}</p>` : ""}
      <p style="text-align: center; margin: 24px 0;">
        <a href="${ballotUrl}" class="btn">Vote Now</a>
      </p>
      <p style="font-size: 13px; color: #6b7280;">
        It only takes about 30 seconds.
      </p>
    `,
  };
}
