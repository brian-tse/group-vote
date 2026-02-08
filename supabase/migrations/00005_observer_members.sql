-- Add observer flag for members who can view votes/results but cannot cast ballots
alter table members add column observer boolean not null default false;
