-- Migration: remove 'holidays' category from albums, add 'graduations', update default
-- Apply this to any existing Neon DB instance that was seeded from the old schema.

-- Reclassify any existing holidays albums to reunions before dropping the constraint.
UPDATE public.albums SET category = 'reunions' WHERE category = 'holidays';

-- Replace the CHECK constraint with the new category list.
ALTER TABLE public.albums DROP CONSTRAINT IF EXISTS albums_category_check;
ALTER TABLE public.albums
  ADD CONSTRAINT albums_category_check
    CHECK (category = ANY (ARRAY[
      'childhood', 'birthdays', 'graduations',
      'weddings', 'reunions', 'historical', 'memorials'
    ]));

-- Update the column default.
ALTER TABLE public.albums ALTER COLUMN category SET DEFAULT 'childhood';
