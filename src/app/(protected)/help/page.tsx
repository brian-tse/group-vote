import { getCurrentMember } from "@/lib/auth";

export default async function HelpPage() {
  const member = await getCurrentMember();
  const isAdmin = member.role === "admin";

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">How to Use ACAMG Voting</h1>
        <p className="mt-1 text-sm text-gray-500">
          A quick guide to voting, proposing, and managing your group&apos;s decisions.
        </p>
      </div>

      {/* Getting Started */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Getting Started</h2>
        <div className="rounded-lg border bg-white p-6 text-sm text-gray-700 space-y-2">
          <p>
            <strong>Logging in:</strong> Enter your email on the login page and click{" "}
            <em>Send Login Link</em>. Check your inbox and click the link — you&apos;ll be
            signed in automatically. Links expire after 15 minutes.
          </p>
          <p>
            Your session lasts 7 days. Only emails added by an admin can log in.
          </p>
        </div>
      </section>

      {/* Dashboard */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
        <div className="rounded-lg border bg-white p-6 text-sm text-gray-700 space-y-2">
          <p>Your home screen shows:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Open Votes</strong> — Votes accepting ballots. Shows whether you&apos;ve voted or still need to.</li>
            <li><strong>Recent Results</strong> — Completed votes you can review.</li>
            <li><strong>Quick Actions</strong> — Shortcuts to propose a vote or view history.</li>
          </ul>
        </div>
      </section>

      {/* Casting Your Vote */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Casting Your Vote</h2>
        <div className="rounded-lg border bg-white p-6 text-sm text-gray-700 space-y-4">
          <p>Click any open vote from the dashboard to see details and cast your ballot.</p>
          <div className="space-y-2">
            <p><strong>Yes / No</strong> — Click Yes or No. Recorded instantly.</p>
            <p><strong>Multiple Choice</strong> — Click your preferred option. Recorded instantly.</p>
            <p>
              <strong>Ranked Choice</strong> — Drag and drop to rank options from most preferred (#1)
              to least. Click <em>Submit Ranking</em> when ready.
            </p>
          </div>
          <div className="rounded bg-navy-50 p-3 text-navy-500">
            You can change your vote anytime while the vote is open — just return to the vote page.
          </div>
        </div>
      </section>

      {/* Vote Settings */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Understanding Vote Settings</h2>
        <div className="rounded-lg border bg-white p-6 text-sm text-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 pr-4 font-semibold">Setting</th>
                  <th className="pb-2 font-semibold">What It Means</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">Format</td>
                  <td className="py-2">Yes/No, Multiple Choice, or Ranked Choice</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">Privacy</td>
                  <td className="py-2">
                    <strong>Anonymous</strong> = fully secret. <strong>Admin-Visible</strong> = admin
                    can see individual votes. <strong>Open</strong> = everyone can see.
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">Quorum</td>
                  <td className="py-2">
                    Percentage of active members who must vote for the result to count
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">Threshold</td>
                  <td className="py-2">
                    Percentage needed to pass — e.g., Simple Majority (&gt;50%), Two-Thirds, etc.
                  </td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-medium">Deadline</td>
                  <td className="py-2">
                    When voting closes. Some votes are open-ended and closed manually by an admin.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Viewing Results</h2>
        <div className="rounded-lg border bg-white p-6 text-sm text-gray-700 space-y-2">
          <p>Once a vote is closed, click it to see:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Outcome</strong> — Passed, Failed, or Quorum Not Met</li>
            <li><strong>Quorum &amp; threshold checks</strong> — Did enough members vote? Did the winner meet the threshold?</li>
            <li><strong>Vote breakdown</strong> — Bar charts showing how votes landed</li>
          </ul>
          <p>
            For ranked choice votes, results show round-by-round elimination until a winner emerges.
          </p>
        </div>
      </section>

      {/* Proposing */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Proposing a Vote</h2>
        <div className="rounded-lg border bg-white p-6 text-sm text-gray-700 space-y-2">
          <p>Any member can suggest a vote:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Click <strong>Propose</strong> in the top nav</li>
            <li>Fill in a title, optional description, format, and settings</li>
            <li>For Multiple Choice or Ranked Choice, add at least 2 options</li>
            <li>Click <strong>Submit Proposal</strong></li>
          </ol>
          <p>
            Your proposal goes to an admin for review. They may approve it, adjust the settings,
            or decline with a note.
          </p>
        </div>
      </section>

      {/* Voting History */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Your Voting History</h2>
        <div className="rounded-lg border bg-white p-6 text-sm text-gray-700 space-y-2">
          <p>
            Click <strong>History</strong> in the top nav to see your personal record — participation
            rate, votes you&apos;ve cast, and votes you missed.
          </p>
        </div>
      </section>

      {/* Admin Section */}
      {isAdmin && (
        <>
          <hr className="border-gray-200" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Admin Guide</h2>
            <p className="mt-1 text-sm text-gray-500">
              These features are available to admins only.
            </p>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Managing Members</h2>
            <div className="rounded-lg border bg-white p-6 text-sm text-gray-700 space-y-2">
              <p>
                Go to <strong>Admin → Members</strong> to manage who can access ACAMG Voting:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Add</strong> — Enter a name and email. They can log in immediately.</li>
                <li><strong>Deactivate</strong> — Temporarily removes from voting. Won&apos;t count toward quorum.</li>
                <li><strong>Remove</strong> — Permanently deletes a member.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Reviewing Proposals</h2>
            <div className="rounded-lg border bg-white p-6 text-sm text-gray-700 space-y-2">
              <p>
                Go to <strong>Admin → Proposals</strong> to see member-submitted proposals:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Approve &amp; Create Vote</strong> — Creates a draft vote you can review before opening.</li>
                <li><strong>Reject</strong> — Declines the proposal, optionally with a reason.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Creating &amp; Managing Votes</h2>
            <div className="rounded-lg border bg-white p-6 text-sm text-gray-700 space-y-2">
              <p>
                Go to <strong>Admin → Manage Votes → Create Vote</strong> to create a vote from
                scratch. Fill in the details and click Create — it saves as a <strong>Draft</strong>.
              </p>
              <p>On any vote&apos;s detail page, you&apos;ll see admin controls:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Open Vote</strong> — Makes a draft vote live for members</li>
                <li><strong>Close Vote</strong> — Ends voting and finalizes results</li>
              </ul>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Participation Dashboard</h2>
            <div className="rounded-lg border bg-white p-6 text-sm text-gray-700 space-y-2">
              <p>
                Go to <strong>Admin → Participation</strong> to see a table of all active members
                with their vote counts and participation rates. Click column headers to sort.
              </p>
              <p>
                Color-coded: green (≥75%), yellow (50-74%), red (&lt;50%).
              </p>
            </div>
          </section>
        </>
      )}

      {/* Quick Reference */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Quick Reference</h2>
        <div className="rounded-lg border bg-white p-6 text-sm text-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 pr-4 font-semibold">Action</th>
                  <th className="pb-2 font-semibold">Where</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4">Vote</td>
                  <td className="py-2">Dashboard → click open vote → cast ballot</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Change your vote</td>
                  <td className="py-2">Return to the vote page while it&apos;s still open</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">Propose a vote</td>
                  <td className="py-2">Top nav → Propose</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">View results</td>
                  <td className="py-2">Dashboard → click closed vote</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">See your history</td>
                  <td className="py-2">Top nav → History</td>
                </tr>
                {isAdmin && (
                  <>
                    <tr className="border-b">
                      <td className="py-2 pr-4">Manage members</td>
                      <td className="py-2">Admin → Members</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4">Review proposals</td>
                      <td className="py-2">Admin → Proposals</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4">Create a vote</td>
                      <td className="py-2">Admin → Manage Votes → Create Vote</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">View participation</td>
                      <td className="py-2">Admin → Participation</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
