-- ============================================================================
-- Complete Legacy Link PostgreSQL Schema for Neon
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Authentication & Users
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'family_member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ
);

-- 2. Families
CREATE TABLE IF NOT EXISTS public.families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    motto TEXT,
    origin_story TEXT,
    cover_photo_url TEXT,
    active_tree_template TEXT DEFAULT 'traditional' NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Members
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    maiden_name TEXT,
    gender TEXT,
    generation INTEGER DEFAULT 1 NOT NULL,
    avatar_url TEXT,
    is_living BOOLEAN DEFAULT true NOT NULL,
    date_of_birth DATE,
    date_of_passing DATE,
    birth_place TEXT,
    resting_place TEXT,
    occupation TEXT,
    bio TEXT,
    professional_title TEXT,
    current_organization TEXT,
    location TEXT,
    contact_links TEXT,
    has_pet BOOLEAN DEFAULT false NOT NULL,
    pet_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'family_member' NOT NULL,
    invited_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure family_id column exists if table existed previously
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='family_id') THEN
        ALTER TABLE public.profiles ADD COLUMN family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Relationships
CREATE TABLE IF NOT EXISTS public.relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    from_member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    to_member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL,
    started_at DATE,
    ended_at DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Invitation Codes
CREATE TABLE IF NOT EXISTS public.invitation_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    role TEXT DEFAULT 'family_member' NOT NULL,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    created_by UUID,
    redeemed_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    redeemed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ
);

-- 7. Albums & Photos
CREATE TABLE IF NOT EXISTS public.albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'childhood' NOT NULL,
    description TEXT,
    cover_photo_url TEXT,
    featured_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    caption TEXT,
    taken_at DATE,
    uploaded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.photo_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    photo_id UUID NOT NULL REFERENCES public.photos(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE
);

-- 8. Cookbook & Recipes
CREATE TABLE IF NOT EXISTS public.cookbook_albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    style TEXT DEFAULT 'traditional' NOT NULL,
    description TEXT,
    cover_photo_url TEXT,
    featured_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    album_id UUID NOT NULL,
    family_id UUID NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    is_vegetarian BOOLEAN DEFAULT false NOT NULL,
    photo_url TEXT,
    ingredients TEXT[] DEFAULT '{}' NOT NULL,
    instructions TEXT[] DEFAULT '{}' NOT NULL,
    cook_time TEXT,
    family_story TEXT,
    contributed_by_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure family_id column exists on recipes if older table was created
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='family_id') THEN
        ALTER TABLE public.recipes ADD COLUMN family_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='album_id') THEN
        ALTER TABLE public.recipes ADD COLUMN album_id UUID;
    END IF;
END $$;

-- 9. Memories & Events
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    era TEXT,
    author_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    cover_photo_url TEXT,
    related_member_ids UUID[] DEFAULT '{}' NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    event_type TEXT NOT NULL,
    description TEXT,
    location TEXT,
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Announcements & Chronicle
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    priority TEXT DEFAULT 'normal' NOT NULL,
    posted_by_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chronicle_eras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    era_label TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    headline TEXT NOT NULL,
    narrative TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Biographies & Legacy
CREATE TABLE IF NOT EXISTS public.biographies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    professional_summary TEXT,
    early_life_background TEXT,
    education TEXT,
    career_journey TEXT,
    professional_achievements TEXT,
    areas_of_expertise TEXT[],
    community_contributions TEXT,
    personal_philosophy TEXT,
    legacy TEXT,
    personal_life TEXT,
    updated_by_profile_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.legacy_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    author_profile_id UUID,
    author_name TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.legacy_contribution_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contribution_id UUID NOT NULL REFERENCES public.legacy_contributions(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE
);

-- 12. Heritage Language Vault & Audio
CREATE TABLE IF NOT EXISTS public.language_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    entry_type TEXT NOT NULL,
    term TEXT NOT NULL,
    meaning TEXT NOT NULL,
    answer TEXT,
    audio_url TEXT,
    said_by_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    contributed_by_profile_id UUID,
    contributed_by_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. Audit Log
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
    actor_id UUID,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. Seed Default M'Ikunyua Family & Import Users if Missing
INSERT INTO public.families (id, name, motto, origin_story)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'M''Ikunyua Family',
    'Preserving our roots and legacy for generations',
    'The official family hub and heritage vault for the M''Ikunyua family.'
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Import existing user accounts and auto-link their profiles to the M'Ikunyua family
INSERT INTO public.users (id, email, password_hash, name, role, created_at)
VALUES
  ('fa143c04-574b-40bb-8692-dfe8dd5f1be8', 'jmnanjau@gmail.com', '$2a$10$QM5OxkeVzPtRMXcxLQv4I.QrM2pRMNA1O9R/e1d.cGJQk2gL4WRF6', 'Jefferson Mwiti', 'family_admin', '2026-09-11 13:12:24.054286+00'),
  ('5a42b93e-393c-4f83-b0cb-2731e36f58d2', 'gitarimukami15@gmail.com', '$2a$10$kk7kZo1iODTTs127sioPsuQvemkLgQv1d/tq2bDznLqXFU637jiNW', 'Kathomi Gitari', 'super_admin', '2026-09-09 18:11:27.152776+00'),
  ('9a9c533d-ccb3-4053-9b00-337cab55ced7', 'mamamwesh03@gmail.com', '$2a$10$6pzjTFmxzCLnOiA62dGqSOzDi3nFqz697T0IV5iUWticrbNgyYTo.', 'Mercy Mwongera', 'family_admin', '2026-09-10 10:32:55.363825+00'),
  ('a39abcb6-eccc-49fa-9235-d38eefddbbaa', 'gitari1martin@gmail.com', '$2a$10$pa39j5gfHRSajZOT61hNwuVezRg0DXsx3MFvgEHjd.kLMXtet/yeG', 'Martin Gitari', 'family_admin', '2026-09-10 14:08:48.003324+00')
ON CONFLICT (email) DO NOTHING;

-- Link profiles to the M'Ikunyua family
INSERT INTO public.profiles (id, family_id, display_name, email, role)
VALUES
  ('5a42b93e-393c-4f83-b0cb-2731e36f58d2', 'a0000000-0000-0000-0000-000000000001', 'Kathomi Gitari', 'gitarimukami15@gmail.com', 'super_admin'),
  ('fa143c04-574b-40bb-8692-dfe8dd5f1be8', 'a0000000-0000-0000-0000-000000000001', 'Jefferson Mwiti', 'jmnanjau@gmail.com', 'family_admin'),
  ('9a9c533d-ccb3-4053-9b00-337cab55ced7', 'a0000000-0000-0000-0000-000000000001', 'Mercy Mwongera', 'mamamwesh03@gmail.com', 'family_admin'),
  ('a39abcb6-eccc-49fa-9235-d38eefddbbaa', 'a0000000-0000-0000-0000-000000000001', 'Martin Gitari', 'gitari1martin@gmail.com', 'family_admin')
ON CONFLICT (id) DO UPDATE SET family_id = EXCLUDED.family_id, display_name = EXCLUDED.display_name;
