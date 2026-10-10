-- Marks the founding ancestor(s) the family tree should start from.
-- Without a marker the tree falls back to the lowest generation number.

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS is_founder boolean DEFAULT false NOT NULL;
