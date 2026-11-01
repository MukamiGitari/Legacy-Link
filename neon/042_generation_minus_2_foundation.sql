-- Migration 042: Ensure Generation -2 (Kurirua) is the Foundation of M'Ikunyua family

-- 1. Ensure Kurirua is Generation -2 and is_founder = true
INSERT INTO public.members (id, family_id, first_name, last_name, gender, generation, is_founder, occupation, bio, birth_place)
VALUES
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
 'Kurirua', 'Ancestor', 'male', -2, true,
 'Founding Ancestor',
 'Founding apex ancestor and foundation of the M''Ikunyua lineage. Great-grandfather of Senior Chief Gerald Kithinji M''Ikunyua and father of M''Mbwiria.',
 'Meru, Kenya')
ON CONFLICT (id) DO UPDATE SET
 generation = -2,
 is_founder = true,
 bio = EXCLUDED.bio;

-- 2. Ensure M'Mbwiria is Generation -1
INSERT INTO public.members (id, family_id, first_name, last_name, gender, generation, is_founder, occupation, bio, birth_place)
VALUES
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
 'M''Mbwiria', 'son of Kurirua', 'male', -1, false,
 'Lineage Patriarch',
 'Father of Nkuruu M''Mbwiria and grandfather of Senior Chief Gerald Kithinji M''Ikunyua. Son of Kurirua.',
 'Meru, Kenya')
ON CONFLICT (id) DO UPDATE SET
 generation = -1,
 is_founder = false;

-- 3. Ensure Nkuruu is Generation 0 and not marked sole founder so Gen -2 is apex
UPDATE public.members
SET is_founder = false
WHERE id = 'b0000000-0000-0000-0000-000000000001' AND family_id = 'a0000000-0000-0000-0000-000000000001';

-- 4. Verify parent relationships Kurirua (-2) -> M'Mbwiria (-1) -> Nkuruu (0)
INSERT INTO public.relationships (family_id, from_member_id, to_member_id, relationship_type)
VALUES
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000004', 'parent'),
('a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'parent')
ON CONFLICT DO NOTHING;
