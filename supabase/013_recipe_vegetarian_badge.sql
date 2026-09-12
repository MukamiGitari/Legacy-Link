-- Migration: converts "Vegetarian" from a recipe section into an independent
-- star badge (`is_vegetarian`) that can be set on a recipe in any section.
-- Only needed if you already ran 012_recipes.sql before this change — fresh
-- projects can just run schema.sql, which already has the new shape.
--
-- Run this in the Supabase SQL Editor. Safe to re-run (idempotent).

alter table recipes add column if not exists is_vegetarian boolean not null default false;

-- Recipes previously filed under the 'vegetarian' section move to 'main' and
-- keep their vegetarian-ness as the new badge instead.
update recipes set is_vegetarian = true, category = 'main' where category = 'vegetarian';

alter table recipes drop constraint if exists recipes_category_check;
alter table recipes add constraint recipes_category_check
  check (category in ('breakfast','main','snacks','desserts'));
