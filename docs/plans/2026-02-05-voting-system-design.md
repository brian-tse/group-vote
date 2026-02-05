# Group Vote — Anesthesia Group Voting System

## What Is This?

Group Vote is a private website built for our anesthesia group to vote on things together — scheduling changes, policy decisions, leadership elections, financial matters, and anything else the group needs to weigh in on.

**How it works in plain terms:**

1. **You get an email with a link.** When there's something to vote on, you'll receive an email. Tap the link and you're in — no password to remember, no app to download.

2. **You vote.** Depending on the topic, you might vote yes/no, pick from a list, or rank your preferences. It takes about 30 seconds.

3. **You can change your mind.** Not sure yet? Vote now and change it later before the deadline. Only your final answer counts.

4. **Your vote can be private.** For sensitive topics (like personnel decisions or elections), votes are fully anonymous — nobody, not even the admin, can see who voted for what. For less sensitive topics, votes can be open.

5. **You get reminded.** If you haven't voted and the deadline is approaching, you'll get a friendly nudge. No more "I forgot to fill out that form."

6. **Results are clear.** When voting closes, everyone sees the outcome: what passed, what didn't, and whether enough people voted for it to count.

**Why not just use Google Forms?** Google Forms can't guarantee one-person-one-vote, can't do anonymous-but-verified voting, doesn't support ranked choice, and has no way to track participation or enforce quorum rules. This system is purpose-built for group governance, not just surveys. (See the detailed comparison below.)

**Who runs it?** An admin (or small group of admins) manages the member list and approves votes before they go live. Any group member can propose a topic for a vote.

---

## Technical Overview

A web-based voting system for a ~35-40 member anesthesia group to make collective decisions on policy, financial, personnel, and governance matters. The system prioritizes participation, vote privacy, and integrity (one person, one vote).

---

## Why Not Google Forms?

Google Forms handles basic surveys, but this group needs a **governance system** — not a poll tool. Here's where Google Forms falls short:

| Requirement | Google Forms | Group Vote |
|---|---|---|
| **Anonymous but verified** | Pick one: anonymous OR signed-in. Cannot separate "who voted" from "how they voted." | Participation tracking and vote privacy are separated at the database level. You know *that* someone voted without knowing *how*. |
| **One person, one vote** | Relies on Google accounts. Members may have multiple accounts. No allowlist enforcement. | Locked to a curated email allowlist. One magic link per verified member. |
| **Ranked choice + instant runoff** | Not supported. Requires exporting to a spreadsheet and manually calculating rounds. | Built-in tallying with automatic instant-runoff rounds. |
| **Quorum & thresholds** | No concept of "invalid unless 75% participate" or "needs 2/3 to pass." | Configurable per vote, automatically enforced. Votes marked "Inconclusive" if quorum isn't met. |
| **Reminders to non-voters** | Cannot identify who hasn't responded (especially if anonymous). Requires manual chasing. | Auto-reminders targeted only at members who haven't voted yet. |
| **Vote change** | Clunky — requires finding an "edit response" link from a confirmation email. | First-class feature with clear UI showing current vote and one-tap change. |
| **Proposal workflow** | Each poll is a standalone link. No submit-for-review process. | Members propose, admin reviews/approves, then it goes live to the group. |
| **Centralized history** | Polls scattered across dozens of separate Form links over time. | Single dashboard with all open votes, past results, and personal voting history. |
| **Participation tracking** | No aggregated view of engagement across polls. | Admin dashboard shows who consistently votes (not how they vote) to identify disengaged members. |

**In short:** Google Forms is a survey tool. Group Vote is an institutional decision-making system with identity verification, privacy guarantees, formal decision rules, and a permanent record of group governance.

---

## Roles

- **Admin** — manages the member email allowlist, approves proposed votes, can create votes directly, triggers manual reminders, and has access to participation dashboards
- **Member** — authenticates via magic link, proposes votes (pending admin approval), casts and changes votes, views results
- **System** — handles magic link generation, email delivery, automatic reminders, vote tallying, and deadline enforcement

---

## Authentication

1. Admin maintains an allowlist of eligible email addresses
2. Member enters their email on the login page
3. If recognized, they receive a magic link (valid for ~15 minutes)
4. Clicking the link creates a session (7-day expiry) so they don't need a new link every visit
5. Each session is tied to exactly one email — enforces one person, one vote

---

## Vote Privacy Levels (Configurable Per Vote)

- **Anonymous** — the system records *that* a member voted (for quorum tracking) but stores the vote choice separately with no link back to the voter. Even admins cannot see who voted how.
- **Admin-visible** — admin can see individual votes; other members cannot
- **Open** — everyone can see who voted for what

### Anonymous Vote Implementation

Two separate database records with no foreign key between them:
- A **participation record**: "Member X voted on Vote #42"
- A **ballot record**: "Someone chose Option B on Vote #42"

This makes it impossible to link a vote to a person, even with direct database access.

---

## Vote Formats

- **Yes/No** — simple binary for approving proposals, policy changes, or motions
- **Multiple Choice** — pick one from a list of options (scheduling preferences, vendor selection, etc.)
- **Ranked Choice** — rank all options by preference. Uses instant-runoff tallying (eliminate lowest-ranked option, redistribute votes) to find the consensus winner. Best for elections or 3+ option decisions.

---

## Vote Lifecycle

1. **Draft** — a member proposes a vote (title, description, options, format, privacy level, thresholds). Sits in admin's pending queue.
2. **Review** — admin sees the proposal, can edit/approve/reject it with optional feedback. Admins can also create votes directly, skipping this step.
3. **Open** — the vote goes live. All members receive an email notification with a magic link directly to the ballot.
4. **Voting Period** — members cast votes. They can change their vote at any time while it's open. A live participation meter shows "22 of 38 have voted" (no results shown to avoid bandwagon effects).
5. **Closed** — the deadline passes (time-bound) or the admin manually closes it (open-ended). Results are tallied and published to all members.

### Changing Votes

- Members can recast as many times as they want before closing
- Only the final vote counts
- UI shows: "Your current vote: Option B. Change?"

---

## Threshold Rules (Configurable Per Vote)

- **Quorum** — minimum participation required (e.g., "75% of members must vote")
- **Passing threshold** — what it takes to win:
  - Simple majority (>50%)
  - 2/3 supermajority
  - 3/4 supermajority
  - Custom percentage
- If quorum isn't met, the vote is marked **"Inconclusive"** rather than failed

---

## Notifications & Participation Encouragement

### Email Triggers

| Event | Recipients | Timing |
|---|---|---|
| Vote opened | All members | Immediately |
| Automatic reminder (halfway) | Non-voters only | Halfway to deadline |
| Automatic reminder (24h) | Non-voters only | 24 hours before deadline |
| Closing soon | Non-voters only | 2 hours before deadline |
| Manual reminder | Non-voters only | On admin trigger |
| Results published | All members | When vote closes |

### Participation Features

- **Progress bar on each vote** — "28 of 38 have voted" visible to all members (social proof without revealing results)
- **Personal dashboard** — voting history, missed votes, open votes needing attention
- **Admin dashboard** — participation rates by member (not how they voted, just whether they voted)
- **"You have X open votes" banner** — shown on login so nothing gets missed

### What Notifications Do NOT Include

- No partial results or tallies mid-vote
- No indication of how others voted (unless the vote is configured as open)

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React + Next.js | SSR for fast mobile loads, API routes built in |
| Styling | Tailwind CSS | Responsive, mobile-first — important for voting between cases |
| Backend | Next.js API routes | Single codebase, no separate server |
| Database | PostgreSQL via Supabase | Row-level security for anonymous vote separation, hosted |
| Email | Resend or SendGrid | Reliable transactional email for magic links and reminders |
| Hosting | Vercel | One-click deploy, automatic HTTPS, perfect Next.js integration |
| Scheduled Jobs | Vercel Cron or Supabase Edge Functions | Automatic reminders and deadline enforcement |

### Why This Stack

- Single codebase (no separate backend to maintain)
- Mobile-friendly by default
- Free or very low cost at this scale (~40 users, occasional votes)
- No server management required

---

## Data Model (High Level)

### Members
- id, email, name, role (admin/member), created_at, active

### Votes
- id, title, description, format (yes_no/multiple_choice/ranked_choice), privacy_level (anonymous/admin_visible/open), status (draft/pending_review/open/closed), quorum_percentage, passing_threshold, deadline (nullable for open-ended), created_by, created_at, closed_at

### Vote Options
- id, vote_id, label, description, display_order

### Participation Records
- id, vote_id, member_id, voted_at, updated_at

### Ballot Records (anonymous votes)
- id, vote_id, choice (option_id or ranked array), cast_at

### Ballot Records (non-anonymous votes)
- id, vote_id, member_id, choice (option_id or ranked array), cast_at

### Vote Proposals
- id, proposed_by, title, description, format, privacy_level, options, status (pending/approved/rejected), admin_notes, created_at

---

## Key Pages

1. **Login** — email input, magic link request
2. **Dashboard** — open votes, recent results, participation stats
3. **Vote Detail** — ballot interface, progress bar, vote/change vote
4. **Results** — tallied results, participation stats, visual breakdown
5. **Propose Vote** — form for members to suggest a new vote
6. **Admin: Review Queue** — pending proposals to approve/reject/edit
7. **Admin: Create Vote** — direct vote creation with all configuration options
8. **Admin: Members** — manage the email allowlist
9. **Admin: Participation** — per-member engagement metrics
