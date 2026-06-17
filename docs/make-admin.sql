-- Promote a user to admin.
-- 1) Have the person sign up on the site first (so a profiles row exists).
-- 2) Run this in the Supabase SQL Editor, replacing the email.

update profiles
set role = 'admin'
where email = 'you@example.com';

-- Verify:
-- select id, email, role from profiles where role = 'admin';
