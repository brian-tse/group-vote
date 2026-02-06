import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

const FROM_ADDRESS = "Group Vote <votes@yourdomain.com>";

/**
 * Base email layout that wraps all transactional emails.
 * Includes group branding and a footer with unsubscribe info.
 */
function wrapInTemplate(bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
    .container { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { font-size: 20px; font-weight: 700; color: #111827; margin: 0; }
    .header p { font-size: 13px; color: #6b7280; margin: 4px 0 0; }
    .body { font-size: 15px; line-height: 1.6; color: #374151; }
    .body h2 { font-size: 18px; font-weight: 600; color: #111827; margin: 0 0 8px; }
    .body p { margin: 0 0 16px; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px; }
    .btn:hover { background: #1d4ed8; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #9ca3af; }
    .footer a { color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>Group Vote</h1>
        <p>Anesthesia Group Voting System</p>
      </div>
      <div class="body">
        ${bodyHtml}
      </div>
    </div>
    <div class="footer">
      <p>
        This is an automated message from Group Vote.<br />
        You're receiving this because you're a member of the anesthesia group.
      </p>
    </div>
  </div>
</body>
</html>`.trim();
}

export interface SendEmailParams {
  to: string;
  subject: string;
  bodyHtml: string;
}

/**
 * Send a single email using Resend with the Group Vote template.
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const resend = getResendClient();

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.to,
    subject: params.subject,
    html: wrapInTemplate(params.bodyHtml),
  });

  if (error) {
    throw new Error(`Failed to send email to ${params.to}: ${error.message}`);
  }
}

/**
 * Send the same email to multiple recipients (one email per recipient for privacy).
 * Failures for individual recipients are logged but do not stop the batch.
 */
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  bodyHtml: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const to of recipients) {
    try {
      await sendEmail({ to, subject, bodyHtml });
      sent++;
    } catch (err) {
      console.error(
        `Email send failed for ${to}:`,
        err instanceof Error ? err.message : err
      );
      failed++;
    }
  }

  return { sent, failed };
}
