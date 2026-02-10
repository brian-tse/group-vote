import type { VoteResult } from "@/lib/tallying";
import { getResultStatus, getResultExplanation } from "@/lib/result-helpers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Magic link email -- sent when a member requests to log in.
 */
export function magicLinkEmail(magicLinkUrl: string) {
  return {
    subject: "Your ACAMG Voting login link",
    bodyHtml: `
      <h2>Sign in to ACAMG Voting</h2>
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
 * Includes the actual vote results inline.
 */
export function resultsPublishedEmail(
  voteTitle: string,
  voteId: string,
  result: VoteResult
) {
  const resultsUrl = `${APP_URL}/votes/${voteId}/results`;
  const status = getResultStatus(result);
  const explanation = getResultExplanation(result);

  const statusColor =
    status === "Passed" ? "#166534" : status === "Failed" ? "#991b1b" : "#854d0e";
  const statusBg =
    status === "Passed" ? "#dcfce7" : status === "Failed" ? "#fee2e2" : "#fef9c3";

  // Build vote breakdown rows
  let breakdownHtml = "";

  if (
    (result.format === "yes_no" ||
      result.format === "multiple_choice" ||
      result.format === "approval" ||
      result.format === "multi_select") &&
    "counts" in result
  ) {
    const rows = (result.counts as { label: string; count: number; optionId: string }[])
      .map((item) => {
        const pct =
          result.totalBallots > 0
            ? Math.round((item.count / result.totalBallots) * 100)
            : 0;
        const isWinner = result.winner?.optionId === item.optionId;
        const bold = isWinner ? "font-weight: bold;" : "";
        return `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; ${bold}">${item.label}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; ${bold}">${item.count} (${pct}%)</td>
          </tr>`;
      })
      .join("");

    breakdownHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Option</th>
            <th style="padding: 8px 12px; text-align: right; font-size: 13px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Votes</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  } else if (result.format === "ranked_choice") {
    const winnerText = result.winner
      ? `<p style="margin: 8px 0;"><strong>Winner:</strong> ${result.winner.label} (after ${(result as { rounds: unknown[] }).rounds.length} round${(result as { rounds: unknown[] }).rounds.length !== 1 ? "s" : ""})</p>`
      : "";
    breakdownHtml = winnerText;
  } else if (result.format === "rsvp") {
    const r = result as { goingCount: number; maybeCount: number; notGoingCount: number };
    breakdownHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr>
          <td style="padding: 12px; text-align: center; background: #dcfce7; border-radius: 6px;">
            <div style="font-size: 13px; color: #166534;">Going</div>
            <div style="font-size: 24px; font-weight: bold; color: #166534;">${r.goingCount}</div>
          </td>
          <td style="width: 8px;"></td>
          <td style="padding: 12px; text-align: center; background: #fef9c3; border-radius: 6px;">
            <div style="font-size: 13px; color: #854d0e;">Maybe</div>
            <div style="font-size: 24px; font-weight: bold; color: #854d0e;">${r.maybeCount}</div>
          </td>
          <td style="width: 8px;"></td>
          <td style="padding: 12px; text-align: center; background: #fee2e2; border-radius: 6px;">
            <div style="font-size: 13px; color: #991b1b;">Not Going</div>
            <div style="font-size: 24px; font-weight: bold; color: #991b1b;">${r.notGoingCount}</div>
          </td>
        </tr>
      </table>`;
  } else if (result.format === "score_rating") {
    const rows = (result as { options: { label: string; averageScore: number; ratingCount: number; optionId: string }[] }).options
      .map((opt) => {
        const isWinner = result.winner?.optionId === opt.optionId;
        const bold = isWinner ? "font-weight: bold;" : "";
        return `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; ${bold}">${opt.label}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: right; ${bold}">${opt.averageScore.toFixed(1)} / 5</td>
          </tr>`;
      })
      .join("");

    breakdownHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Option</th>
            <th style="padding: 8px 12px; text-align: right; font-size: 13px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Avg Score</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  } else if (result.format === "date_poll") {
    const rows = (result as { options: { label: string; yes: number; maybe: number; no: number; optionId: string }[] }).options
      .map((opt) => {
        const isWinner = result.winner?.optionId === opt.optionId;
        const bold = isWinner ? "font-weight: bold;" : "";
        return `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; ${bold}">${opt.label}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #166534;">${opt.yes}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #854d0e;">${opt.maybe}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #991b1b;">${opt.no}</td>
          </tr>`;
      })
      .join("");

    breakdownHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #6b7280; border-bottom: 2px solid #e5e7eb;">Date</th>
            <th style="padding: 8px 12px; text-align: center; font-size: 13px; color: #166534; border-bottom: 2px solid #e5e7eb;">Yes</th>
            <th style="padding: 8px 12px; text-align: center; font-size: 13px; color: #854d0e; border-bottom: 2px solid #e5e7eb;">Maybe</th>
            <th style="padding: 8px 12px; text-align: center; font-size: 13px; color: #991b1b; border-bottom: 2px solid #e5e7eb;">No</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  return {
    subject: `Results: ${voteTitle}`,
    bodyHtml: `
      <h2>Results: ${voteTitle}</h2>
      <div style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background: ${statusBg}; color: ${statusColor}; font-weight: 600; font-size: 14px;">
        ${status}
      </div>
      ${result.winner ? `<span style="margin-left: 8px; font-weight: bold; font-size: 16px;">Winner: ${result.winner.label}</span>` : ""}
      <p style="margin-top: 12px; color: #4b5563; font-size: 14px;">${explanation}</p>
      <div style="display: flex; gap: 12px; margin: 16px 0;">
        <div style="flex: 1; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: ${result.meetsQuorum ? "#f0fdf4" : "#fefce8"};">
          <div style="font-size: 13px; color: #374151;">Quorum</div>
          <div style="font-size: 20px; font-weight: bold;">${result.quorumActual}%</div>
          <div style="font-size: 12px; color: #6b7280;">${result.quorumRequired}% required</div>
        </div>
        <div style="flex: 1; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: ${result.meetsThreshold ? "#f0fdf4" : "#fef2f2"};">
          <div style="font-size: 13px; color: #374151;">Threshold</div>
          <div style="font-size: 20px; font-weight: bold;">${result.thresholdActual}%</div>
          <div style="font-size: 12px; color: #6b7280;">${result.thresholdRequired}% required</div>
        </div>
      </div>
      ${breakdownHtml}
      <p style="font-size: 13px; color: #6b7280; margin-top: 8px;">${result.totalBallots} ballot${result.totalBallots !== 1 ? "s" : ""} cast</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${resultsUrl}" class="btn">View Full Results</a>
      </p>
    `,
  };
}

/**
 * Proposal submitted email -- sent to admins when a member proposes a vote.
 */
export function proposalSubmittedEmail(
  proposalTitle: string,
  proposerName: string,
  format: string
) {
  const reviewUrl = `${APP_URL}/admin/proposals`;

  return {
    subject: `New proposal: ${proposalTitle}`,
    bodyHtml: `
      <h2>New Vote Proposal</h2>
      <p><strong>${proposerName}</strong> has submitted a new proposal:</p>
      <p style="font-size: 16px; font-weight: 600; margin: 16px 0;">${proposalTitle}</p>
      <p>Format: ${format}</p>
      <p style="text-align: center; margin: 24px 0;">
        <a href="${reviewUrl}" class="btn">Review Proposals</a>
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
