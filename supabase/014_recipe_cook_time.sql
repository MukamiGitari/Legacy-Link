-- Migration: adds a free-text "cook time" to each recipe (e.g. "45 min",
-- "1 hr 30 min", "Overnight + 20 min bake"), shown next to the ingredients
-- on the traditional recipe-card layout. Only needed if you already ran
-- 012_recipes.sql before this change — fresh projects can just run
-- schema.sql, which already has this column.
--
-- Run this in the Supabase SQL Editor. Safe to re-run (idempotent).

alter table recipes add column if not exists cook_time text;
