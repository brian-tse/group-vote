-- Group Vote — Full Database Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- ENUM TYPES
-- ============================================================

create type member_role as enum ('admin', 'member');
create type vote_format as enum ('yes_no', 'multiple_choice', 'ranked_choice');
create type privacy_level as enum ('anonymous', 'admin_visible', 'open');
create type vote_status as enum ('draft', 'pending_review', 'open', 'closed');
create type proposal_status as enum ('pending', 'approved', 'rejected');
create type passing_threshold as enum ('simple_majority', 'two_thirds', 'three_quarters', 'custom');

-- ============================================================
-- TABLE: members
-- ============================================================

create table members (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete set null,
  email         text not null unique,
  name          text,
  role          member_role not null default 'member',
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table members is 'Allowlist of eligible group members';
comment on column members.auth_user_id is 'Links to Supabase auth.users once the member first authenticates';
comment on column members.active is 'Inactive members cannot log in or vote but are retained for history';

-- ============================================================
-- TABLE: votes
-- ============================================================

create table votes (
  id                          uuid primary key default gen_random_uuid(),
  title                       text not null,
  description                 text,
  format                      vote_format not null,
  privacy_level               privacy_level not null default 'anonymous',
  status                      vote_status not null default 'draft',
  quorum_percentage           integer not null default 75
                                check (quorum_percentage >= 0 and quorum_percentage <= 100),
  passing_threshold           passing_threshold not null default 'simple_majority',
  custom_threshold_percentage integer
                                check (custom_threshold_percentage is null
                                       or (custom_threshold_percentage > 0 and custom_threshold_percentage <= 100)),
  deadline                    timestamptz,
  created_by                  uuid not null references members(id),
  created_at                  timestamptz not null default now(),
  opened_at                   timestamptz,
  closed_at                   timestamptz,

  constraint custom_threshold_required
    check (passing_threshold != 'custom' or custom_threshold_percentage is not null)
);

comment on table votes is 'A vote/ballot that the group acts on';
comment on column votes.deadline is 'Null means open-ended (admin manually closes)';
comment on column votes.opened_at is 'Timestamp when the vote status was changed to open';

-- ============================================================
-- TABLE: vote_options
-- ============================================================

create table vote_options (
  id             uuid primary key default gen_random_uuid(),
  vote_id        uuid not null references votes(id) on delete cascade,
  label          text not null,
  description    text,
  display_order  integer not null default 0
);

comment on table vote_options is 'Available choices for a vote';

-- ============================================================
-- TABLE: participation_records
-- ============================================================

create table participation_records (
  id          uuid primary key default gen_random_uuid(),
  vote_id     uuid not null references votes(id) on delete cascade,
  member_id   uuid not null references members(id) on delete cascade,
  voted_at    timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint unique_participation unique (vote_id, member_id)
);

comment on table participation_records is 'Records that a member voted, without storing their choice';

-- ============================================================
-- TABLE: ballot_records_anonymous
-- ============================================================

create table ballot_records_anonymous (
  id       uuid primary key default gen_random_uuid(),
  vote_id  uuid not null references votes(id) on delete cascade,
  choice   jsonb not null,
  cast_at  timestamptz not null default now()
);

comment on table ballot_records_anonymous is 'Anonymous ballot choices — deliberately has NO member_id';
comment on column ballot_records_anonymous.choice is 'JSON: {"option_id": "uuid"} for single choice, {"ranked": ["uuid", ...]} for ranked';

-- ============================================================
-- TABLE: ballot_records_named
-- ============================================================

create table ballot_records_named (
  id         uuid primary key default gen_random_uuid(),
  vote_id    uuid not null references votes(id) on delete cascade,
  member_id  uuid not null references members(id) on delete cascade,
  choice     jsonb not null,
  cast_at    timestamptz not null default now(),

  constraint unique_named_ballot unique (vote_id, member_id)
);

comment on table ballot_records_named is 'Named ballot choices for admin-visible and open votes';
comment on column ballot_records_named.choice is 'JSON: {"option_id": "uuid"} for single choice, {"ranked": ["uuid", ...]} for ranked';

-- ============================================================
-- TABLE: vote_proposals
-- ============================================================

create table vote_proposals (
  id                          uuid primary key default gen_random_uuid(),
  proposed_by                 uuid not null references members(id),
  title                       text not null,
  description                 text,
  format                      vote_format not null,
  privacy_level               privacy_level not null default 'anonymous',
  options                     jsonb not null default '[]'::jsonb,
  quorum_percentage           integer not null default 75
                                check (quorum_percentage >= 0 and quorum_percentage <= 100),
  passing_threshold           passing_threshold not null default 'simple_majority',
  custom_threshold_percentage integer
                                check (custom_threshold_percentage is null
                                       or (custom_threshold_percentage > 0 and custom_threshold_percentage <= 100)),
  status                      proposal_status not null default 'pending',
  admin_notes                 text,
  created_at                  timestamptz not null default now(),
  reviewed_at                 timestamptz,

  constraint proposal_custom_threshold_required
    check (passing_threshold != 'custom' or custom_threshold_percentage is not null)
);

comment on table vote_proposals is 'Member-submitted vote proposals pending admin review';
comment on column vote_proposals.options is 'JSON array: [{"label": "...", "description": "..."}]';

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_members_email on members (email);
create index idx_members_auth_user_id on members (auth_user_id) where auth_user_id is not null;
create index idx_members_active on members (active) where active = true;

create index idx_votes_status on votes (status);
create index idx_votes_created_by on votes (created_by);
create index idx_votes_deadline on votes (deadline) where deadline is not null;
create index idx_votes_status_created on votes (status, created_at desc);

create index idx_vote_options_vote_id on vote_options (vote_id, display_order);

create index idx_participation_vote_id on participation_records (vote_id);
create index idx_participation_member_id on participation_records (member_id);

create index idx_ballot_anonymous_vote_id on ballot_records_anonymous (vote_id);

create index idx_ballot_named_vote_id on ballot_records_named (vote_id);
create index idx_ballot_named_member_id on ballot_records_named (member_id);

create index idx_proposals_status on vote_proposals (status);
create index idx_proposals_proposed_by on vote_proposals (proposed_by);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger members_updated_at
  before update on members
  for each row execute function update_updated_at();

create trigger participation_updated_at
  before update on participation_records
  for each row execute function update_updated_at();

-- ============================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================

alter table members enable row level security;
alter table votes enable row level security;
alter table vote_options enable row level security;
alter table participation_records enable row level security;
alter table ballot_records_anonymous enable row level security;
alter table ballot_records_named enable row level security;
alter table vote_proposals enable row level security;

-- Helper functions
create or replace function get_current_member_id()
returns uuid as $$
  select id from members where auth_user_id = auth.uid() limit 1;
$$ language sql security definer stable;

create or replace function is_current_user_admin()
returns boolean as $$
  select exists (
    select 1 from members
    where auth_user_id = auth.uid()
      and role = 'admin'
      and active = true
  );
$$ language sql security definer stable;

-- MEMBERS policies
create policy "Members: authenticated users can view active members"
  on members for select to authenticated
  using (active = true);

create policy "Members: admins can view all members"
  on members for select to authenticated
  using (is_current_user_admin());

create policy "Members: admins can insert"
  on members for insert to authenticated
  with check (is_current_user_admin());

create policy "Members: admins can update"
  on members for update to authenticated
  using (is_current_user_admin());

create policy "Members: users can update own name"
  on members for update to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

-- VOTES policies
create policy "Votes: members can view open and closed"
  on votes for select to authenticated
  using (status in ('open', 'closed'));

create policy "Votes: admins can view all"
  on votes for select to authenticated
  using (is_current_user_admin());

create policy "Votes: creators can view own drafts"
  on votes for select to authenticated
  using (created_by = get_current_member_id() and status = 'draft');

create policy "Votes: admins can insert"
  on votes for insert to authenticated
  with check (is_current_user_admin());

create policy "Votes: admins can update"
  on votes for update to authenticated
  using (is_current_user_admin());

-- VOTE_OPTIONS policies
create policy "Vote options: readable by authenticated users"
  on vote_options for select to authenticated
  using (
    exists (
      select 1 from votes
      where votes.id = vote_options.vote_id
        and (votes.status in ('open', 'closed') or is_current_user_admin())
    )
  );

create policy "Vote options: admins can insert"
  on vote_options for insert to authenticated
  with check (is_current_user_admin());

create policy "Vote options: admins can update"
  on vote_options for update to authenticated
  using (is_current_user_admin());

create policy "Vote options: admins can delete"
  on vote_options for delete to authenticated
  using (is_current_user_admin());

-- PARTICIPATION_RECORDS policies
create policy "Participation: members can view"
  on participation_records for select to authenticated
  using (true);

create policy "Participation: members can insert own"
  on participation_records for insert to authenticated
  with check (member_id = get_current_member_id());

create policy "Participation: members can update own"
  on participation_records for update to authenticated
  using (member_id = get_current_member_id());

-- BALLOT_RECORDS_ANONYMOUS policies
-- No SELECT policy = no read access through the API. Tallying uses service role.
create policy "Anonymous ballots: insert via authenticated"
  on ballot_records_anonymous for insert to authenticated
  with check (true);

-- BALLOT_RECORDS_NAMED policies
create policy "Named ballots: open votes readable by all"
  on ballot_records_named for select to authenticated
  using (
    exists (
      select 1 from votes
      where votes.id = ballot_records_named.vote_id
        and votes.privacy_level = 'open'
        and votes.status = 'closed'
    )
  );

create policy "Named ballots: admin-visible readable by admins"
  on ballot_records_named for select to authenticated
  using (
    is_current_user_admin()
    and exists (
      select 1 from votes
      where votes.id = ballot_records_named.vote_id
        and votes.privacy_level in ('admin_visible', 'open')
    )
  );

create policy "Named ballots: members can view own"
  on ballot_records_named for select to authenticated
  using (member_id = get_current_member_id());

create policy "Named ballots: members can insert own"
  on ballot_records_named for insert to authenticated
  with check (member_id = get_current_member_id());

create policy "Named ballots: members can update own"
  on ballot_records_named for update to authenticated
  using (member_id = get_current_member_id());

-- VOTE_PROPOSALS policies
create policy "Proposals: members can view own"
  on vote_proposals for select to authenticated
  using (proposed_by = get_current_member_id());

create policy "Proposals: admins can view all"
  on vote_proposals for select to authenticated
  using (is_current_user_admin());

create policy "Proposals: members can insert"
  on vote_proposals for insert to authenticated
  with check (proposed_by = get_current_member_id());

create policy "Proposals: admins can update"
  on vote_proposals for update to authenticated
  using (is_current_user_admin());

create policy "Proposals: members can update own pending"
  on vote_proposals for update to authenticated
  using (proposed_by = get_current_member_id() and status = 'pending');
