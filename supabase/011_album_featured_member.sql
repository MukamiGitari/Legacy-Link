-- Migration: lets an album be tagged as being "about" a specific family
-- member (e.g. "Grandma's 80th Birthday" -> Grandma), shown as a tag next to
-- the album title in the Gallery. Deleting albums/photos already works via
-- the existing generic admin-only delete RLS policy in schema.sql — no
-- policy changes needed for that, just this new column.
--
-- Run this in the Supabase SQL Editor against an existing project. Safe to
-- re-run (idempotent). Fresh projects can just run schema.sql, which already
-- includes this column.

alter table albums add column if not exists featured_member_id uuid references members(id) on delete set null;
