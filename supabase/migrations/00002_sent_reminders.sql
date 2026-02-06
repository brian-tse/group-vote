-- Tracks which automatic reminders have been sent for each vote
-- to prevent duplicate reminder emails.

create table sent_reminders (
  id         uuid primary key default gen_random_uuid(),
  vote_id    uuid not null references votes(id) on delete cascade,
  type       text not null check (type in ('halfway', '24h', '2h')),
  sent_at    timestamptz not null default now(),

  -- One reminder of each type per vote
  constraint unique_reminder_per_vote unique (vote_id, type)
);

comment on table sent_reminders is 'Tracks which automatic reminders have been sent per vote';

create index idx_sent_reminders_vote_id on sent_reminders (vote_id);

-- RLS: only accessible via service role (cron job)
alter table sent_reminders enable row level security;
-- No policies — only the service role key can access this table
