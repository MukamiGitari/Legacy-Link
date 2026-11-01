-- ============================================================================
-- Migration 043: Mark ancestors & elder siblings deceased, keeping Gerald & Lily ALIVE
-- 
-- 1. All older ancestors (Generations 0, -1, -2: Nkuruu, Salome, M'Mbwiria, Kurirua)
--    and elder siblings/relatives in Generation 1 are marked deceased.
-- 2. Senior Chief Gerald Kithinji M'Ikunyua & Lily Ncurubi are explicitly ALIVE (is_living = true).
-- ============================================================================

-- First mark all preceding generations (0, -1, -2) and other gen 1 members deceased
UPDATE public.members
SET is_living = false
WHERE generation <= 1;

-- Explicitly ensure Senior Chief Gerald and Lily remain ALIVE
UPDATE public.members
SET is_living = true, date_of_passing = NULL, resting_place = NULL
WHERE id IN (
  'b0000000-0000-0000-0001-000000000001', -- Senior Chief Gerald Kithinji M'Ikunyua
  'b0000000-0000-0000-0001-000000000002'  -- Lily Ncurubi
);
