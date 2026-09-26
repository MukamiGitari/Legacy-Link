-- ============================================================================
-- Seed Meru Traditional Recipes into M'Ikunyua Cookbook
-- ============================================================================

-- 1. Ensure a default Cookbook Album exists for the M'Ikunyua family
INSERT INTO public.cookbook_albums (
    id,
    family_id,
    title,
    style,
    description
)
VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'M''Ikunyua Traditional Kitchen & Heritage Recipes',
    'traditional',
    'Authentic Kĩmĩrũ culinary traditions, comfort breakfasts, fermented delicacies, and classic family staples.'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description;

-- 2. Insert the 3 Traditional Recipes
INSERT INTO public.recipes (
    id,
    album_id,
    family_id,
    title,
    category,
    is_vegetarian,
    ingredients,
    instructions,
    cook_time,
    family_story
)
VALUES
(
    'c0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Meru-Style Uji (Traditional Porridge)',
    'breakfast',
    true,
    ARRAY[
        '2 cups of water',
        '¼ cup of wimbi (finger millet flour)',
        '3 tablespoons sugar (or to taste)',
        '¼ to ½ teaspoon lemon, lime juice or citric acid (for traditional sour kick)'
    ],
    ARRAY[
        'Bring 1½ cups of the water to a boil in a sufuria (pot).',
        'In a separate bowl, mix the wimbi flour with the remaining ½ cup of cold water to form a smooth pouring paste.',
        'Pour the flour mixture slowly into the boiling water while stirring continuously to prevent lumps.',
        'Keep stirring as it thickens into a smooth consistency, then let it simmer and boil well for about 5 minutes.',
        'Stir in the sugar and a splash of lemon or lime juice for tartness, then serve hot.'
    ],
    '15 mins',
    'A smooth, comforting daily breakfast porridge made from millet or finger millet (wimbi), treasured across Meru homes.'
),
(
    'c0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Mukimo wa Kimeru (Mashed Potatoes, Maize, and Greens)',
    'main',
    true,
    ARRAY[
        '4 large potatoes, peeled and chopped',
        '1 cup fresh maize kernels',
        '2 cups fresh pumpkin leaves (thiri) or spinach/icoho, washed and chopped',
        '1 onion, diced',
        '2 seasoning cubes or salt to taste',
        '2 tablespoons cooking oil',
        'Fresh coriander for garnish'
    ],
    ARRAY[
        'Boil the potatoes, fresh maize, and greens together in a pot with a little salt until soft and tender.',
        'Drain any excess water, then mash the mixture together thoroughly using a wooden masher (mwiko/mukimo stick) until well blended.',
        'In a separate pan, heat cooking oil and sauté the diced onions until golden brown.',
        'Stir in the mashed potato and maize mixture, add seasoning cubes or extra salt, and mix well over low heat for a minute.',
        'Garnish with fresh coriander and serve hot as a main meal or alongside a rich meat stew.'
    ],
    '45 mins',
    'Mukimo is a beloved staple combining starches and fresh garden greens, served at family gatherings and celebrations.'
),
(
    'c0000000-0000-0000-0000-000000000004',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Traditional Meru Fermented Porridge (Ucuru wa Gukia)',
    'breakfast',
    true,
    ARRAY[
        'Millet flour (Mùhĩa)',
        'Fresh water',
        'Traditional gourd (Kìgò) or ceramic/glass container for fermentation'
    ],
    ARRAY[
        'Soak the millet flour and grind it further on a traditional grinding stone if available.',
        'Mix the ground grains with water and squeeze the mixture repeatedly with your hands to extract the rich, starchy liquid.',
        'Pour the liquid extract into a traditional gourd (Kìgò) or a clean container.',
        'Let the mixture ferment naturally for one full day or longer depending on how sour you prefer it.',
        'Serve the porridge cold (optionally sweetened with a little sugar) or gently warmed on the stove.'
    ],
    '24 hours (fermentation)',
    'Ucuru is a traditional Meru fermented millet porridge with a nourishing, tangy flavor, celebrated for vitality and culture.'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    category = EXCLUDED.category,
    is_vegetarian = EXCLUDED.is_vegetarian,
    ingredients = EXCLUDED.ingredients,
    instructions = EXCLUDED.instructions,
    cook_time = EXCLUDED.cook_time,
    family_story = EXCLUDED.family_story;

-- Verify
SELECT title, category, cook_time, array_length(ingredients, 1) as ingredient_count
FROM public.recipes
WHERE family_id = 'a0000000-0000-0000-0000-000000000001';
