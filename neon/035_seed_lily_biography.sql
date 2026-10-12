-- ============================================================================
-- Seed Lily Ncurubi Biography & Update Member Profile
-- Family: M'Ikunyua Family ('a0000000-0000-0000-0000-000000000001')
-- Member: Lily Ncurubi ('b0000000-0000-0000-0001-000000000002')
-- ============================================================================

-- 1. Enrich Lily Ncurubi's Member Record
UPDATE public.members
SET birth_place = 'Meru, Kenya',
    occupation = 'Matriarch, Agribusiness Entrepreneur & Community Leader',
    bio = 'Matriarch of the M''Ikunyua family, educated at Kaaga Girls Intermediate, respected agribusiness entrepreneur and community leader who anchored the family homestead and legacy.',
    is_founder = false,
    professional_title = 'Matriarch & Farm Enterprise Director',
    location = 'Kinoru, Meru, Kenya'
WHERE id = 'b0000000-0000-0000-0001-000000000002';

-- 2. Insert or Update Lily Ncurubi's Biography
INSERT INTO public.biographies (
    id,
    family_id,
    member_id,
    professional_summary,
    early_life_background,
    education,
    career_journey,
    agricultural_pioneering,
    historical_context,
    cultural_heritage,
    adversity_and_resilience,
    professional_achievements,
    areas_of_expertise,
    community_contributions,
    personal_philosophy,
    legacy,
    personal_life,
    updated_at
) VALUES (
    'd0000000-0000-0000-0001-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0001-000000000002',
    'Lily Ncurubi is the beloved matriarch of the M''Ikunyua family, an astute businesswoman, community pillar, and the steadfast anchor of the household throughout Senior Chief Gerald M''Ikunyua''s long public, agricultural, and administrative career. Educated at Kaaga Girls Intermediate School, she was known across Kinoru and Meru for her commercial acumen, quiet strength, and organizational brilliance. She is famously celebrated in family history for her decisive entrepreneurship in late 1985 when, while Gerald was away on a trade delegation in the Middle East, she single-handedly mobilized distribution and sold all 500 crates of eggs stored on their farm, rescuing the family''s commercial enterprise during a national market crisis.',

    'Lily was born and raised in Meru, hailing from a respected family closely connected to the pioneering educational community of Kaaga and Embu. She was a close relative to Timothy Kinyua (who studied at Embu Agricultural Technical College) and shared community and schooling ties with Gerald’s Kaaga classmates. Her youth was characterized by discipline, Christian diligence, and academic dedication during the transformative era of the 1950s in Meru.',

    'Lily attended Kaaga Girls Intermediate School, reaching Class 6 in 1956—a distinguished educational attainment for young women in Mount Kenya East during the colonial period. Her schooling grounded her in literacy, bookkeeping, home sciences, and leadership that would define her life as a community leader and farm enterprise manager.',

    'From the inception of their marriage, Lily was the co-architect and operational backbone of the M''Ikunyua family enterprises. While Gerald served in government veterinary postings, international study tours, and chieftainship, Lily oversaw daily operations at the Kinoru homestead. She managed their dairy herd, cash crops, and commercial poultry units. During the 1980s, she managed local egg sales across Meru, coordinating orders, supply logistics, and client accounts.',

    'Partnered with Gerald in managing high-yield grade cattle and commercial poultry farming. When the family ventured into commercial egg production with over 300 layers, Lily managed daily egg collection, sorting, storage, and retail sales across Meru and neighboring markets.',

    'Witnessed firsthand the Mau Mau emergency in Mount Kenya East, the expansion of Methodist mission education at Kaaga, Kenya''s birth as an independent republic in 1963, and the succession of presidents. During the political tensions of the 1980s that saw Gerald unfairly suspended from public office, Lily was the steady, calming presence who ensured the household remained self-reliant and dignified.',

    'Embodied the highest ideals of Kimeru womanhood, grace, and community solidarity. She supported Gerald in 1961 when he courageously broke with traditional superstition to purchase their first heifer prior to marriage, proving that faith and progress go hand in hand.',

    'Steadfastly anchored the home during Gerald''s extensive travels abroad—including his two-year scholarship in India (1964–1966), agricultural tours across Europe, America, and Israel, and his civil service postings in Kitale, Chuka, and Nanyuki. Her resilience culminated in November 1985 when, facing 500 crates of unsold eggs and marketing bottlenecks, she personally took charge of distribution and cleared the entire store before Gerald returned from Dubai and Saudi Arabia.',

    '• Educated at Kaaga Girls Intermediate School (Class 6, 1956).
• Co-founded and steered the M''Ikunyua agricultural and poultry enterprises in Kinoru.
• Successfully raised six university-educated children who have become leaders across education, engineering, commerce, and public life.
• Renowned community counselor and matriarch across Kinoru.',

    ARRAY['Agribusiness Management', 'Poultry Operations', 'Rural Commerce', 'Family Stewardship', 'Community Mentorship', 'Hospitality'],

    'Devoted member of the Kinoru church community, actively supporting women''s fellowships, local educational Harambees, and extending warm hospitality to local leaders and international agricultural visitors from the UK, Netherlands, and North America.',

    'Lily lived by the quiet conviction that a family thrives through hard work, loyalty, and unwavering faith: "A home is built not on words, but on steady hands, prayer, and standing together through every season."',

    'Her greatest legacy lives in the strong, educated, and united M''Ikunyua family. Her memory is preserved through her children, twelve grandchildren, and her namesake granddaughter, Lily Kimathi. She is remembered as the indispensable foundation upon which the family''s modern success was built.',

    'Met Gerald Kithinji M''Ikunyua in 1956 at Meru Hospital while she was a student at Kaaga Girls Intermediate School. Together, they shared a lifelong marriage and raised six children: Thomas Muriithi, Timothy Mwirigi, Jane Kathure, Martin Gitari, Betty Karwitha, and Edwin Kimathi, who blessed them with twelve grandchildren.',

    now()
)
ON CONFLICT (member_id) DO UPDATE SET
    professional_summary = EXCLUDED.professional_summary,
    early_life_background = EXCLUDED.early_life_background,
    education = EXCLUDED.education,
    career_journey = EXCLUDED.career_journey,
    agricultural_pioneering = EXCLUDED.agricultural_pioneering,
    historical_context = EXCLUDED.historical_context,
    cultural_heritage = EXCLUDED.cultural_heritage,
    adversity_and_resilience = EXCLUDED.adversity_and_resilience,
    professional_achievements = EXCLUDED.professional_achievements,
    areas_of_expertise = EXCLUDED.areas_of_expertise,
    community_contributions = EXCLUDED.community_contributions,
    personal_philosophy = EXCLUDED.personal_philosophy,
    legacy = EXCLUDED.legacy,
    personal_life = EXCLUDED.personal_life,
    updated_at = now();
