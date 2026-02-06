-- Development seed data — do NOT run in production

-- Insert test members (auth_user_id will be linked after first magic-link login)
insert into members (email, name, role, active) values
  ('admin@example.com',   'Admin User',    'admin',  true),
  ('member1@example.com', 'Alice Johnson', 'member', true),
  ('member2@example.com', 'Bob Smith',     'member', true),
  ('member3@example.com', 'Carol Davis',   'member', true),
  ('member4@example.com', 'Dave Wilson',   'member', true),
  ('inactive@example.com','Eve Brown',     'member', false);
