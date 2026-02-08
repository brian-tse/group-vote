-- Multi-Division Support (Part 2)
-- ============================================================
-- Uses the super_admin enum value added in Part 1.
-- Must run in a separate transaction from the ALTER TYPE.
-- ============================================================

-- ============================================================
-- 1. Promote specific members to super_admin
-- ============================================================

update members set role = 'super_admin'
  where email in ('tsb@acamedicalgroup.com', 'jf@acamedicalgroup.com', 'sg@acamedicalgroup.com');

-- Set observers
update members set observer = true
  where email in ('ariel@acamedicalgroup.com', 'amy@acamedicalgroup.com');

-- ============================================================
-- 2. RLS write policies referencing super_admin
-- ============================================================

create policy "Divisions: writable by super-admins"
  on divisions for insert to authenticated
  with check (
    exists (
      select 1 from members
      where auth_user_id = auth.uid()
        and role = 'super_admin'
        and active = true
    )
  );

create policy "Divisions: updatable by super-admins"
  on divisions for update to authenticated
  using (
    exists (
      select 1 from members
      where auth_user_id = auth.uid()
        and role = 'super_admin'
        and active = true
    )
  );

-- ============================================================
-- 3. Update is_current_user_admin() to include super_admin
-- ============================================================

create or replace function is_current_user_admin()
returns boolean as $$
  select exists (
    select 1 from members
    where auth_user_id = auth.uid()
      and role in ('admin', 'super_admin')
      and active = true
  );
$$ language sql security definer stable;
