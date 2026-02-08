export type MemberRole = "admin" | "member" | "super_admin";

export type VoteFormat =
  | "yes_no"
  | "multiple_choice"
  | "ranked_choice"
  | "date_poll"
  | "approval"
  | "rsvp"
  | "score_rating"
  | "multi_select";

export type PrivacyLevel = "anonymous" | "admin_visible" | "open";

export type VoteStatus = "draft" | "pending_review" | "open" | "closed";

export type ProposalStatus = "pending" | "approved" | "rejected";

export type PassingThreshold =
  | "simple_majority"
  | "two_thirds"
  | "three_quarters"
  | "custom";

export interface Member {
  id: string;
  email: string;
  name: string | null;
  role: MemberRole;
  active: boolean;
  voting_member: boolean;
  observer: boolean;
  division_id: string;
  created_at: string;
}

export interface Vote {
  id: string;
  title: string;
  description: string | null;
  format: VoteFormat;
  privacy_level: PrivacyLevel;
  status: VoteStatus;
  quorum_percentage: number;
  passing_threshold: PassingThreshold;
  custom_threshold_percentage: number | null;
  deadline: string | null;
  division_id: string | null;
  created_by: string;
  created_at: string;
  closed_at: string | null;
}

export interface VoteOption {
  id: string;
  vote_id: string;
  label: string;
  description: string | null;
  display_order: number;
}

/** Slim version of VoteOption for client-side ballot components */
export type BallotOption = Pick<VoteOption, "id" | "label" | "description">;

export interface ParticipationRecord {
  id: string;
  vote_id: string;
  member_id: string;
  voted_at: string;
  updated_at: string;
}

export interface BallotRecordAnonymous {
  id: string;
  vote_id: string;
  choice: string;
  cast_at: string;
}

export interface BallotRecordNamed {
  id: string;
  vote_id: string;
  member_id: string;
  choice: string;
  cast_at: string;
}

export interface VoteComment {
  id: string;
  vote_id: string;
  member_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  member_name: string | null;
  member_email: string;
}

export interface VoteProposal {
  id: string;
  proposed_by: string;
  title: string;
  description: string | null;
  format: VoteFormat;
  privacy_level: PrivacyLevel;
  options: string;
  quorum_percentage: number;
  passing_threshold: PassingThreshold;
  custom_threshold_percentage: number | null;
  division_id: string | null;
  status: ProposalStatus;
  admin_notes: string | null;
  created_at: string;
}

export interface Division {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}
