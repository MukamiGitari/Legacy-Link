-- ============================================================================
-- Migration 037: Update Gerald Siblings, Ancestors & Seed Default Albums
-- Family: M'Ikunyua Family ('a0000000-0000-0000-0000-000000000001')
-- ============================================================================

-- 1. Mark Salome Gateti CioMuga, Second Wife, and Lily Ncurubi as married-in (is_founder = false)
UPDATE public.members
SET is_founder = false
WHERE id IN (
  'b0000000-0000-0000-0000-000000000002', -- Salome Gateti CioMuga
  'b0000000-0000-0000-0000-000000000003', -- Second Wife
  'b0000000-0000-0000-0001-000000000002'  -- Lily Ncurubi (married in to Gerald Kithinji M'Ikunyua)
);

-- Ensure Nkuruu M'Mbwiria remains marked as bloodline patriarch / founder
UPDATE public.members
SET is_founder = true
WHERE id = 'b0000000-0000-0000-0000-000000000001';

-- 2. Insert Ancestors of Nkuruu (M'Mbwiria son of Kurirua & Kurirua)
INSERT INTO public.members (id, family_id, first_name, last_name, gender, generation, is_founder, occupation, bio, birth_place)
VALUES
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
 'Kurirua', 'Ancestor', 'male', -2, true,
 'Founding Ancestor',
 'Great-grandfather of Senior Chief Gerald Kithinji M''Ikunyua and father of M''Mbwiria.',
 'Meru, Kenya'),

('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
 'M''Mbwiria', 'son of Kurirua', 'male', -1, true,
 'Lineage Patriarch',
 'Father of Nkuruu M''Mbwiria and grandfather of Senior Chief Gerald Kithinji M''Ikunyua. Son of Kurirua.',
 'Meru, Kenya')
ON CONFLICT (id) DO UPDATE SET
 first_name = EXCLUDED.first_name,
 last_name = EXCLUDED.last_name,
 gender = EXCLUDED.gender,
 generation = EXCLUDED.generation,
 is_founder = EXCLUDED.is_founder,
 occupation = EXCLUDED.occupation,
 bio = EXCLUDED.bio,
 birth_place = EXCLUDED.birth_place;

-- Parent links for Kurirua -> M'Mbwiria -> Nkuruu
INSERT INTO public.relationships (family_id, from_member_id, to_member_id, relationship_type)
VALUES
('a0000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'parent'),
('a0000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'parent')
ON CONFLICT DO NOTHING;

-- 3. Update Real Names of the 5 Siblings from Memoir
-- Sons of Salome Gateti (First Wife):
-- 1. Geoffrey Baichu
UPDATE public.members
SET first_name = 'Geoffrey',
    last_name = 'Baichu',
    bio = 'First son of Salome Gateti and Nkuruu M''Mbwiria; elder brother of Senior Chief Gerald Kithinji M''Ikunyua.'
WHERE id = 'b0000000-0000-0000-0001-000000000011';

-- 2. Silas Ruteere
UPDATE public.members
SET first_name = 'Silas',
    last_name = 'Ruteere',
    bio = 'Second son of Salome Gateti and Nkuruu M''Mbwiria; elder brother of Senior Chief Gerald Kithinji M''Ikunyua.'
WHERE id = 'b0000000-0000-0000-0001-000000000012';

-- Sons of Second Wife:
-- 4. M'Mwongo Nkuruu
UPDATE public.members
SET first_name = 'M''Mwongo',
    last_name = 'Nkuruu',
    bio = 'Son of the second wife of Nkuruu M''Mbwiria; brother of Senior Chief Gerald Kithinji M''Ikunyua.'
WHERE id = 'b0000000-0000-0000-0001-000000000021';

-- 5. John M'Riria
UPDATE public.members
SET first_name = 'John',
    last_name = 'M''Riria',
    bio = 'Son of the second wife of Nkuruu M''Mbwiria; brother of Senior Chief Gerald Kithinji M''Ikunyua.'
WHERE id = 'b0000000-0000-0000-0001-000000000022';

-- 6. Festus Ruguku (Mwalili)
UPDATE public.members
SET first_name = 'Festus Ruguku',
    last_name = '(Mwalili)',
    bio = 'Son of the second wife of Nkuruu M''Mbwiria; brother of Senior Chief Gerald Kithinji M''Ikunyua.'
WHERE id = 'b0000000-0000-0000-0001-000000000023';

-- 4. Seed Default Category Albums in Neon
-- Ensures photo uploads directly to existing category albums always find a valid album in database
INSERT INTO public.albums (id, family_id, title, category, description)
VALUES
('b0000000-0000-0003-000000000001', 'a0000000-0000-0000-0000-000000000001',
 'Gerald & Lily''s Wedding & Family', 'weddings', 'Celebrating love and union in Meru.'),

('b0000000-0000-0003-000000000002', 'a0000000-0000-0000-0000-000000000001',
 'M''Ikunyua Family Reunion', 'reunions', 'Generations of the M''Ikunyua family gathered together.'),

('b0000000-0000-0003-000000000003', 'a0000000-0000-0000-0000-000000000001',
 'Childhood in Kinoru', 'childhood', 'Growing up on the slopes of Mount Kenya in Kinoru village.'),

('b0000000-0000-0003-000000000004', 'a0000000-0000-0000-0000-000000000001',
 'The Homestead & Farms, 1950s–1980s', 'historical', 'Early photographs of exotic dairy cattle, coffee farms, and the homestead.'),

('b0000000-0000-0003-000000000005', 'a0000000-0000-0000-0000-000000000001',
 'Remembering Senior Chief Gerald M''Ikunyua', 'memorials', 'A tribute album honoring the legacy, leadership, and public service of Senior Chief Gerald M''Ikunyua.'),

('b0000000-0000-0003-000000000006', 'a0000000-0000-0000-0000-000000000001',
 'Christmas at the Homestead', 'reunions', 'Annual festive gatherings and family traditions.')
ON CONFLICT (id) DO UPDATE SET
 title = EXCLUDED.title,
 category = EXCLUDED.category,
 description = EXCLUDED.description;
