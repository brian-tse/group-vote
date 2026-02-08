-- Vote comments with one-level threading
-- Comments are always attributed (member name shown), even on anonymous votes

-- Table
create table vote_comments (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null references votes(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  parent_id uuid references vote_comments(id) on delete cascade,
  body text not null check (char_length(body) >= 1 and char_length(body) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index idx_vote_comments_vote_created on vote_comments (vote_id, created_at);
create index idx_vote_comments_parent on vote_comments (parent_id) where parent_id is not null;
create index idx_vote_comments_member on vote_comments (member_id);

-- Nesting enforcement: parent_id must reference a top-level comment (no nested replies)
create or replace function enforce_comment_nesting()
returns trigger as $$
begin
  if new.parent_id is not null then
    -- If the referenced comment itself has a parent, re-point to the root
    select coalesce(parent_id, id) into new.parent_id
    from vote_comments
    where id = new.parent_id;

    if not found then
      raise exception 'Parent comment does not exist';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger check_comment_nesting
  before insert on vote_comments
  for each row execute function enforce_comment_nesting();

-- Auto-update updated_at on edit
create or replace function update_comment_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_comment_updated_at
  before update on vote_comments
  for each row execute function update_comment_updated_at();

-- RLS
alter table vote_comments enable row level security;

-- SELECT: any authenticated member can read comments on open/closed votes
create policy "Members can view comments on open/closed votes"
  on vote_comments for select
  using (
    exists (
      select 1 from votes
      where votes.id = vote_comments.vote_id
        and votes.status in ('open', 'closed')
    )
    or
    exists (
      select 1 from members
      where members.auth_user_id = auth.uid()
        and members.role = 'admin'
    )
  );

-- INSERT: own member_id only, on open votes only
create policy "Members can comment on open votes"
  on vote_comments for insert
  with check (
    member_id = (
      select id from members where auth_user_id = auth.uid()
    )
    and exists (
      select 1 from votes
      where votes.id = vote_comments.vote_id
        and votes.status = 'open'
    )
  );

-- UPDATE: own comments only
create policy "Members can edit own comments"
  on vote_comments for update
  using (
    member_id = (
      select id from members where auth_user_id = auth.uid()
    )
  );

-- DELETE: own comments or admin
create policy "Members can delete own comments or admin can delete any"
  on vote_comments for delete
  using (
    member_id = (
      select id from members where auth_user_id = auth.uid()
    )
    or exists (
      select 1 from members
      where members.auth_user_id = auth.uid()
        and members.role = 'admin'
    )
  );
