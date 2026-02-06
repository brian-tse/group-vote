export type MemberRole = "admin" | "member";

export type VoteFormat = "yes_no" | "multiple_choice" | "ranked_choice";

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
  status: ProposalStatus;
  admin_notes: string | null;
  created_at: string;
}
