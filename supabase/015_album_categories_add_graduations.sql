-- Adds the new "graduations" photo-album category, and also fixes a
-- pre-existing gap where 'birthdays' was a valid category in the app's
-- TypeScript types but was never included in this table's check constraint
-- (so creating a Birthdays album against Supabase would have failed).
alter table albums drop constraint if exists albums_category_check;
alter table albums add constraint albums_category_check
  check (category in ('weddings','reunions','childhood','historical','memorials','holidays','birthdays','graduations'));
