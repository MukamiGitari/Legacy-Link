-- ============================================================================
-- Migration 039: Fix Missing Columns and Types on Recipes Table
-- Ensures public.recipes table has all required columns and compatible types
-- ============================================================================

-- 1. Ensure cookbook_albums table exists
CREATE TABLE IF NOT EXISTS public.cookbook_albums (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id uuid NOT NULL,
    title text NOT NULL,
    style text DEFAULT 'traditional' NOT NULL,
    description text,
    cover_photo_url text,
    featured_member_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Add missing Legacy-Link columns to public.recipes
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS album_id uuid;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS family_id uuid;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS category text DEFAULT 'main';
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS is_vegetarian boolean DEFAULT false;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS cook_time text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS family_story text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS contributed_by_member_id uuid;

-- 3. If owner_id existed from an older schema and was set to NOT NULL, make it optional
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'recipes' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE public.recipes ALTER COLUMN owner_id DROP NOT NULL;
    END IF;
END $$;

-- 4. Convert ingredients and instructions to text[] if they were created as json/jsonb/text
DO $$
BEGIN
    -- If ingredients is JSON or JSONB, convert to text[]
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'recipes' 
          AND column_name = 'ingredients' 
          AND data_type IN ('json', 'jsonb')
    ) THEN
        ALTER TABLE public.recipes 
          ALTER COLUMN ingredients DROP DEFAULT,
          ALTER COLUMN ingredients TYPE text[] USING (
            CASE 
              WHEN ingredients IS NULL THEN '{}'::text[]
              ELSE ARRAY(SELECT jsonb_array_elements_text(to_jsonb(ingredients)))
            END
          ),
          ALTER COLUMN ingredients SET DEFAULT '{}'::text[];
    END IF;

    -- If instructions is a single text string instead of text[], convert to text[]
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'recipes' 
          AND column_name = 'instructions' 
          AND data_type = 'text'
    ) THEN
        ALTER TABLE public.recipes 
          ALTER COLUMN instructions DROP DEFAULT,
          ALTER COLUMN instructions TYPE text[] USING (
            CASE 
              WHEN instructions IS NULL THEN '{}'::text[]
              ELSE string_to_array(instructions, E'\n')
            END
          ),
          ALTER COLUMN instructions SET DEFAULT '{}'::text[];
    END IF;
END $$;

-- 5. Ensure default cookbook album exists for M'Ikunyua family
INSERT INTO public.cookbook_albums (
    id, family_id, title, style, description
) VALUES (
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'M''Ikunyua Traditional Kitchen & Heritage Recipes',
    'traditional',
    'Authentic Kĩmĩrũ culinary traditions, comfort breakfasts, fermented delicacies, and classic family staples.'
) ON CONFLICT (id) DO NOTHING;
