-- Migration 023: Add named_after column to members
-- Supports the African cultural practice of naming children after ancestors.
-- Free-text field, e.g. "Grandfather Reuben Kobia" or "Grandmother Wanjiku".

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS named_after TEXT;
