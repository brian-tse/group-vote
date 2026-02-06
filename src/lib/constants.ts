export const QUORUM_DEFAULT = 75;
export const SESSION_EXPIRY_DAYS = 7;
export const MAGIC_LINK_EXPIRY_MINUTES = 15;

export const PASSING_THRESHOLD_LABELS: Record<string, string> = {
  simple_majority: "Simple Majority (>50%)",
  two_thirds: "Two-Thirds (\u226566.7%)",
  three_quarters: "Three-Quarters (\u226575%)",
  custom: "Custom Percentage",
};

export const VOTE_FORMAT_LABELS: Record<string, string> = {
  yes_no: "Yes / No",
  multiple_choice: "Multiple Choice",
  ranked_choice: "Ranked Choice",
  date_poll: "Date Poll",
  approval: "Approval Voting",
  rsvp: "RSVP / Attendance",
  score_rating: "Score / Rating",
  multi_select: "Multi-Select (Pick N)",
};

export const PRIVACY_LEVEL_LABELS: Record<string, string> = {
  anonymous: "Anonymous",
  admin_visible: "Admin-Visible",
  open: "Open",
};
