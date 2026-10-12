-- ============================================================================
-- Seed Gerald's Parents (Nkuruu M'Mbwiria & Two Wives) and 5 Siblings
-- Family: M'Ikunyua Family ('a0000000-0000-0000-0000-000000000001')
-- ============================================================================

-- Fixed UUIDs:
-- Father:
--   Nkuruu M'Mbwiria:            'b0000000-0000-0000-0000-000000000001'
-- Mother (1st Wife):
--   Salome Gateti CioMuga:       'b0000000-0000-0000-0000-000000000002'
-- 2nd Wife (Stepmother):
--   Second Wife M'Mbwiria:       'b0000000-0000-0000-0000-000000000003'
-- Full Brothers (Sons of Salome):
--   Eldest Brother M'Mbwiria:    'b0000000-0000-0000-0001-000000000011'
--   Second Brother M'Mbwiria:    'b0000000-0000-0000-0001-000000000012'
--   (Gerald Kithinji M'Ikunyua): 'b0000000-0000-0000-0001-000000000001'
-- Stepbrothers (Sons of 2nd Wife):
--   Stepbrother 1 M'Mbwiria:     'b0000000-0000-0000-0001-000000000021'
--   Stepbrother 2 M'Mbwiria:     'b0000000-0000-0000-0001-000000000022'
--   Stepbrother 3 M'Mbwiria:     'b0000000-0000-0000-0001-000000000023'

-- 1. Insert Parents (Generation 0)
INSERT INTO public.members (id, family_id, first_name, last_name, gender, generation, is_founder, occupation, bio, birth_place)
VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
 'Nkuruu', 'M''Mbwiria', 'male', 0, true,
 'Farmer & WWI Veteran',
 'Father of Senior Chief Gerald M''Ikunyua and patriarch of the Mbwiria lineage. A World War I veteran deployed to Dodoma, Tanzania, who farmed bananas, yams, and coffee in Kinoru and kept cattle and sheep.',
 'Kinoru, Meru, Kenya'),

('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
 'Salome Gateti', 'CioMuga', 'female', 0, true,
 'Homesteader & Farmer',
 'Mother of Senior Chief Gerald M''Ikunyua and first wife of Nkuruu M''Mbwiria. Raised three sons in Kinoru, planted millet and ncabi (black beans) in Kithoka, and saved young Gerald from a childhood fire.',
 'Kinoru, Meru, Kenya'),

('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
 'Second Wife', 'M''Mbwiria', 'female', 0, false,
 'Homesteader & Farmer',
 'Second wife of Nkuruu M''Mbwiria who raised three sons in Kinoru alongside Salome Gateti.',
 'Kinoru, Meru, Kenya')
ON CONFLICT (id) DO UPDATE SET
 first_name = EXCLUDED.first_name,
 last_name = EXCLUDED.last_name,
 gender = EXCLUDED.gender,
 generation = EXCLUDED.generation,
 is_founder = EXCLUDED.is_founder,
 occupation = EXCLUDED.occupation,
 bio = EXCLUDED.bio,
 birth_place = EXCLUDED.birth_place;

-- 2. Insert Siblings (Generation 1, same generation as Gerald)
INSERT INTO public.members (id, family_id, first_name, last_name, gender, generation, bio, birth_place)
VALUES
-- Full brothers (House of Salome Gateti)
('b0000000-0000-0000-0001-000000000011', 'a0000000-0000-0000-0000-000000000001',
 'Eldest Brother', 'M''Mbwiria', 'male', 1,
 'First son of Salome Gateti and Nkuruu M''Mbwiria; attended school in the early 1940s and circumcised in 1942.',
 'Kinoru, Meru, Kenya'),

('b0000000-0000-0000-0001-000000000012', 'a0000000-0000-0000-0000-000000000001',
 'Second Brother', 'M''Mbwiria', 'male', 1,
 'Second son of Salome Gateti and Nkuruu M''Mbwiria; attended school in the early 1940s and circumcised in 1942.',
 'Kinoru, Meru, Kenya'),

-- Stepbrothers (House of Second Wife)
('b0000000-0000-0000-0001-000000000021', 'a0000000-0000-0000-0000-000000000001',
 'Stepbrother 1', 'M''Mbwiria', 'male', 1,
 'First son of the second wife of Nkuruu M''Mbwiria; raised in Kinoru homestead.',
 'Kinoru, Meru, Kenya'),

('b0000000-0000-0000-0001-000000000022', 'a0000000-0000-0000-0000-000000000001',
 'Stepbrother 2', 'M''Mbwiria', 'male', 1,
 'Second son of the second wife of Nkuruu M''Mbwiria; raised in Kinoru homestead.',
 'Kinoru, Meru, Kenya'),

('b0000000-0000-0000-0001-000000000023', 'a0000000-0000-0000-0000-000000000001',
 'Stepbrother 3', 'M''Mbwiria', 'male', 1,
 'Third son of the second wife of Nkuruu M''Mbwiria; raised in Kinoru homestead.',
 'Kinoru, Meru, Kenya')
ON CONFLICT (id) DO UPDATE SET
 first_name = EXCLUDED.first_name,
 last_name = EXCLUDED.last_name,
 gender = EXCLUDED.gender,
 generation = EXCLUDED.generation,
 bio = EXCLUDED.bio,
 birth_place = EXCLUDED.birth_place;

-- 3. Relationships

-- 3a. Marriages of Nkuruu M'Mbwiria
INSERT INTO public.relationships (family_id, from_member_id, to_member_id, relationship_type, started_at)
VALUES
-- First wife: Salome Gateti
('a0000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'spouse', '1920-01-01'),
('a0000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'spouse', '1920-01-01'),

-- Second wife
('a0000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'spouse', '1925-01-01'),
('a0000000-0000-0000-0000-000000000001',
 'b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'spouse', '1925-01-01')
ON CONFLICT DO NOTHING;

-- 3b. Parents -> Children for House of Salome Gateti (Gerald + 2 Full Brothers)
INSERT INTO public.relationships (family_id, from_member_id, to_member_id, relationship_type)
VALUES
-- Nkuruu is parent of Eldest Brother, Second Brother, Gerald
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000011', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000012', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0001-000000000001', 'parent'),

-- Salome is parent of Eldest Brother, Second Brother, Gerald
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0001-000000000011', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0001-000000000012', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0001-000000000001', 'parent')
ON CONFLICT DO NOTHING;

-- 3c. Parents -> Children for House of Second Wife (3 Stepbrothers)
INSERT INTO public.relationships (family_id, from_member_id, to_member_id, relationship_type)
VALUES
-- Nkuruu is parent of Stepbrothers
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000021', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000022', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0001-000000000023', 'parent'),

-- Second Wife is parent of Stepbrothers
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0001-000000000021', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0001-000000000022', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'b0000000-0000-0001-000000000023', 'parent')
ON CONFLICT DO NOTHING;
