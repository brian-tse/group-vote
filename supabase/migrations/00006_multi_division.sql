-- Multi-Division Support (Part 1)
-- ============================================================
-- Creates divisions, adds division_id columns, adds enum value.
-- The enum value cannot be used in the same transaction, so
-- role promotions and RLS policies referencing it are in Part 2.
-- ============================================================

-- ============================================================
-- 1. Create divisions table
-- ============================================================

create table divisions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

comment on table divisions is 'Organizational divisions (e.g. San Mateo, San Francisco)';

-- ============================================================
-- 2. Seed SM and SF divisions
-- ============================================================

insert into divisions (name, slug) values
  ('San Mateo', 'sm'),
  ('San Francisco', 'sf');

-- ============================================================
-- 3. Add division_id to members (NOT NULL FK, backfill to SM)
-- ============================================================

alter table members add column division_id uuid references divisions(id);

-- Backfill all existing members to SM
update members
  set division_id = (select id from divisions where slug = 'sm');

alter table members alter column division_id set not null;

-- ============================================================
-- 4. Add division_id to votes (nullable FK, NULL = corp-wide)
-- ============================================================

alter table votes add column division_id uuid references divisions(id);

-- Backfill all existing votes to SM
update votes
  set division_id = (select id from divisions where slug = 'sm');

-- ============================================================
-- 5. Add division_id to vote_proposals (nullable FK)
-- ============================================================

alter table vote_proposals add column division_id uuid references divisions(id);

-- Backfill all existing proposals to SM
update vote_proposals
  set division_id = (select id from divisions where slug = 'sm');

-- ============================================================
-- 6. Add super_admin to member_role enum
-- ============================================================

alter type member_role add value 'super_admin';

-- ============================================================
-- 7. Indexes on new columns
-- ============================================================

create index idx_members_division_id on members (division_id);
create index idx_votes_division_id on votes (division_id);
create index idx_proposals_division_id on vote_proposals (division_id);

-- ============================================================
-- 8. RLS on divisions table (read-only policies safe here)
-- ============================================================

alter table divisions enable row level security;

create policy "Divisions: readable by all authenticated"
  on divisions for select to authenticated
  using (true);
