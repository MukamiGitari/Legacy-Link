-- ============================================================================
-- Migration 038: Merge Unified Family Tree Starting from Nkuruu M'Mbwiria
-- & Seed Gallery Albums to Prevent "Album Not Found"
-- Family: M'Ikunyua Family ('a0000000-0000-0000-0000-000000000001')
-- ============================================================================

-- 1. Set Nkuruu M'Mbwiria as the sole apex founding patriarch of the family tree
UPDATE public.members
SET is_founder = true,
    bio = 'Father of Senior Chief Gerald M''Ikunyua and founding patriarch of the Mbwiria lineage (son of M''Mbwiria, son of Kurirua). A World War I veteran deployed to Dodoma, Tanzania, who farmed bananas, yams, and coffee in Kinoru and kept cattle and sheep.'
WHERE id = 'b0000000-0000-0000-0000-000000000001';

-- 2. Ensure Gerald Kithinji is NOT marked as founder so he nests cleanly under Nkuruu & Salome
UPDATE public.members
SET is_founder = false
WHERE id = 'b0000000-0000-0001-000000000001';

-- 3. Ensure all wives are marked as married-in (is_founder = false)
UPDATE public.members
SET is_founder = false
WHERE id IN (
  'b0000000-0000-0000-0000-000000000002', -- Salome Gateti CioMuga (First Wife)
  'b0000000-0000-0000-0000-000000000003', -- Second Wife
  'b0000000-0000-0001-000000000002'  -- Lily Ncurubi (Wife of Gerald)
);

-- 4. Remove any ancestors above Nkuruu so the tree starts directly at Nkuruu
DELETE FROM public.relationships
WHERE to_member_id = 'b0000000-0000-0000-0000-000000000001'
   OR from_member_id IN ('b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005')
   OR to_member_id IN ('b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005');

DELETE FROM public.members
WHERE id IN ('b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005');

-- 5. Ensure the 5 siblings have their memoir-accurate names and lineages
-- First Wife (Salome Gateti) Sons:
UPDATE public.members
SET first_name = 'Geoffrey', last_name = 'Baichu', is_founder = false,
    bio = 'First son of Salome Gateti and Nkuruu M''Mbwiria; elder brother of Senior Chief Gerald Kithinji M''Ikunyua.'
WHERE id = 'b0000000-0000-0001-000000000011';

UPDATE public.members
SET first_name = 'Silas', last_name = 'Ruteere', is_founder = false,
    bio = 'Second son of Salome Gateti and Nkuruu M''Mbwiria; elder brother of Senior Chief Gerald Kithinji M''Ikunyua.'
WHERE id = 'b0000000-0000-0001-000000000012';

-- Second Wife Sons:
UPDATE public.members
SET first_name = 'M''Mwongo', last_name = 'Nkuruu', is_founder = false,
    bio = 'Son of the second wife of Nkuruu M''Mbwiria; brother of Senior Chief Gerald Kithinji M''Ikunyua.'
WHERE id = 'b0000000-0000-0001-000000000021';

UPDATE public.members
SET first_name = 'John', last_name = 'M''Riria', is_founder = false,
    bio = 'Son of the second wife of Nkuruu M''Mbwiria; brother of Senior Chief Gerald Kithinji M''Ikunyua.'
WHERE id = 'b0000000-0000-0001-000000000022';

UPDATE public.members
SET first_name = 'Festus Ruguku', last_name = '(Mwalili)', is_founder = false,
    bio = 'Son of the second wife of Nkuruu M''Mbwiria; brother of Senior Chief Gerald Kithinji M''Ikunyua.'
WHERE id = 'b0000000-0000-0001-000000000023';

-- 6. Confirm parent-child relationships linking Nkuruu & Salome to Gerald Kithinji
INSERT INTO public.relationships (family_id, from_member_id, to_member_id, relationship_type)
VALUES
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000001', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0001-000000000001', 'parent')
ON CONFLICT DO NOTHING;

-- 7. Add Children of Gerald & Lily (Generation 2)
INSERT INTO public.members (id, family_id, first_name, last_name, gender, generation, is_founder, birth_place, location)
VALUES
('b0000000-0000-0002-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Thomas', 'Muriithi', 'male', 2, false, 'Kinoru, Meru, Kenya', 'Meru, Kenya'),
('b0000000-0000-0002-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Timothy', 'Mwirigi', 'male', 2, false, 'Kinoru, Meru, Kenya', 'Meru, Kenya'),
('b0000000-0000-0002-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Jane', 'Kathure', 'female', 2, false, 'Kinoru, Meru, Kenya', 'Meru, Kenya'),
('b0000000-0000-0002-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Martin', 'Gitari', 'male', 2, false, 'Kinoru, Meru, Kenya', 'Meru, Kenya'),
('b0000000-0000-0002-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Betty', 'Karwitha', 'female', 2, false, 'Kinoru, Meru, Kenya', 'Meru, Kenya'),
('b0000000-0000-0002-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Edwin', 'Kimathi', 'male', 2, false, 'Kinoru, Meru, Kenya', 'Meru, Kenya')
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  gender = EXCLUDED.gender,
  generation = EXCLUDED.generation,
  is_founder = EXCLUDED.is_founder;

-- Parent links for Gerald & Lily -> their 6 children
INSERT INTO public.relationships (family_id, from_member_id, to_member_id, relationship_type)
VALUES
-- Gerald Kithinji as father
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000001', 'b0000000-0000-0002-000000000001', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000001', 'b0000000-0000-0002-000000000002', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000001', 'b0000000-0000-0002-000000000003', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000001', 'b0000000-0000-0002-000000000004', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000001', 'b0000000-0000-0002-000000000005', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000001', 'b0000000-0000-0002-000000000006', 'parent'),
-- Lily Ncurubi as mother
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000002', 'b0000000-0000-0002-000000000001', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000002', 'b0000000-0000-0002-000000000002', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000002', 'b0000000-0000-0002-000000000003', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000002', 'b0000000-0000-0002-000000000004', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000002', 'b0000000-0000-0002-000000000005', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000002', 'b0000000-0000-0002-000000000006', 'parent')
ON CONFLICT DO NOTHING;

-- 8. Seed Default Category Albums in Neon
-- Guarantees that adding photos to any category album immediately succeeds without 404
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
