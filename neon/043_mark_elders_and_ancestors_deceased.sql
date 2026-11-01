-- ============================================================================
-- Migration 043: Mark all members in Generation 1, 0, -1, -2 as deceased (is_living = false)
-- In accordance with family lineage: Senior Chief Gerald, Lily, their siblings,
-- and all preceding generations and founding ancestors are deceased.
-- ============================================================================

UPDATE public.members
SET is_living = false
WHERE generation <= 1;
