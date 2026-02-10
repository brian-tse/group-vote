-- Tag anonymous ballots with voting_member status
-- ============================================================
-- Allows tallying to filter to shareholder-only ballots even
-- for anonymous votes, without breaking anonymity (no member_id).
-- Existing ballots default to true to preserve current behavior.
-- ============================================================

alter table ballot_records_anonymous
  add column voting_member boolean not null default true;
