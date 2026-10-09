--
-- Legacy Link schema, adapted from Supabase for plain Postgres (Neon)
--
-- Changes made vs. the original Supabase dump:
--   1. Removed custom functions current_family_id(), current_role_can_add(),
--      current_role_is_admin(), create_super_admin() -- these relied on
--      Supabase's auth.uid()/auth.role(), which don't exist outside Supabase.
--   2. Removed all "ALTER TABLE ... ENABLE ROW LEVEL SECURITY" and
--      "CREATE POLICY" statements -- your worker's auth.js now enforces
--      family_id/role checks in application code instead of at the DB layer.
--   3. Changed profiles_id_fkey to reference your new public.users(id)
--      table (from auth.js) instead of Supabase's auth.users(id).
--      REVIEW THIS -- see note near that constraint below.
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Schema
--

CREATE SCHEMA IF NOT EXISTS public;

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Tables
--

CREATE TABLE public.albums (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    title text NOT NULL,
    category text DEFAULT 'childhood'::text NOT NULL,
    description text,
    cover_photo_url text,
    featured_member_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT albums_category_check CHECK ((category = ANY (ARRAY['childhood'::text, 'birthdays'::text, 'graduations'::text, 'weddings'::text, 'reunions'::text, 'historical'::text, 'memorials'::text])))
);

CREATE TABLE public.announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    posted_by_member_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT announcements_priority_check CHECK ((priority = ANY (ARRAY['urgent'::text, 'important'::text, 'normal'::text])))
);

CREATE TABLE public.audit_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    actor_id uuid,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.biographies (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    member_id uuid NOT NULL,
    professional_summary text,
    early_life_background text,
    education text,
    career_journey text,
    professional_achievements text,
    areas_of_expertise text[],
    community_contributions text,
    personal_philosophy text,
    legacy text,
    personal_life text,
    updated_by_profile_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.chronicle_eras (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    era_label text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    headline text NOT NULL,
    narrative text,
    photo_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.cookbook_albums (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    title text NOT NULL,
    style text DEFAULT 'traditional'::text NOT NULL,
    description text,
    cover_photo_url text,
    featured_member_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT cookbook_albums_style_check CHECK ((style = 'traditional'::text))
);

CREATE TABLE public.event_rsvps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    member_id uuid,
    profile_id uuid,
    status text DEFAULT 'invited'::text NOT NULL,
    responded_at timestamp with time zone,
    CONSTRAINT event_rsvps_status_check CHECK ((status = ANY (ARRAY['invited'::text, 'going'::text, 'maybe'::text, 'declined'::text])))
);

CREATE TABLE public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    title text NOT NULL,
    event_type text DEFAULT 'reunion'::text NOT NULL,
    description text,
    location text,
    starts_at timestamp with time zone NOT NULL,
    ends_at timestamp with time zone,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT events_event_type_check CHECK ((event_type = ANY (ARRAY['reunion'::text, 'birthday'::text, 'memorial'::text, 'meeting'::text, 'other'::text])))
);

CREATE TABLE public.families (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    motto text,
    origin_story text,
    cover_photo_url text,
    active_tree_template text DEFAULT 'classic'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT families_active_tree_template_check CHECK ((active_tree_template = ANY (ARRAY['classic'::text, 'timeline'::text, 'photo'::text, 'radial'::text, 'minimalist'::text, 'heritage'::text])))
);

CREATE TABLE public.game_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    player_name text NOT NULL,
    game_key text NOT NULL,
    points integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT game_scores_game_key_check CHECK ((game_key = ANY (ARRAY['trivia'::text, 'guessWho'::text, 'birthdayBingo'::text, 'whoSaidIt'::text, 'sudoku'::text, 'flashcards'::text, 'scrabbleTiles'::text]))),
    CONSTRAINT game_scores_points_check CHECK ((points >= 0))
);

CREATE TABLE public.invitation_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    code text NOT NULL,
    role text DEFAULT 'family_member'::text NOT NULL,
    member_id uuid,
    created_by uuid,
    redeemed_by uuid,
    redeemed_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT invitation_codes_role_check CHECK ((role = ANY (ARRAY['family_admin'::text, 'family_member'::text, 'guest'::text])))
);

CREATE TABLE public.language_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    entry_type text NOT NULL,
    term text NOT NULL,
    meaning text NOT NULL,
    answer text,
    audio_url text,
    said_by_member_id uuid,
    contributed_by_profile_id uuid,
    contributed_by_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT language_entries_entry_type_check CHECK ((entry_type = ANY (ARRAY['word'::text, 'phrase'::text, 'proverb'::text, 'riddle'::text, 'saying'::text, 'recording'::text])))
);

CREATE TABLE public.legacy_contribution_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contribution_id uuid NOT NULL,
    member_id uuid NOT NULL
);

CREATE TABLE public.legacy_contributions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    member_id uuid NOT NULL,
    author_profile_id uuid,
    author_name text NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    maiden_name text,
    gender text,
    generation integer DEFAULT 1 NOT NULL,
    avatar_url text,
    is_living boolean DEFAULT true NOT NULL,
    date_of_birth date,
    date_of_passing date,
    birth_place text,
    resting_place text,
    occupation text,
    bio text,
    professional_title text,
    current_organization text,
    location text,
    contact_links text,
    has_pet boolean DEFAULT false NOT NULL,
    pet_name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT members_gender_check CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])))
);

CREATE TABLE public.relationships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    from_member_id uuid NOT NULL,
    to_member_id uuid NOT NULL,
    relationship_type text NOT NULL,
    started_at date,
    ended_at date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT relationships_relationship_type_check CHECK ((relationship_type = ANY (ARRAY['parent'::text, 'child'::text, 'spouse'::text, 'sibling'::text, 'adoptive_parent'::text, 'adoptive_child'::text, 'step_parent'::text, 'step_child'::text])))
);

CREATE VIEW public.member_lineage AS
 SELECT m.id AS member_id,
    m.family_id,
    array_remove(array_agg(DISTINCT
        CASE
            WHEN (r.relationship_type = 'parent'::text) THEN r.from_member_id
            ELSE NULL::uuid
        END), NULL::uuid) AS parent_ids,
    array_remove(array_agg(DISTINCT
        CASE
            WHEN (r.relationship_type = 'child'::text) THEN r.to_member_id
            ELSE NULL::uuid
        END), NULL::uuid) AS child_ids,
    array_remove(array_agg(DISTINCT
        CASE
            WHEN (r.relationship_type = 'spouse'::text) THEN r.to_member_id
            ELSE NULL::uuid
        END), NULL::uuid) AS spouse_ids
   FROM (public.members m
     LEFT JOIN public.relationships r ON ((((r.to_member_id = m.id) AND (r.relationship_type = 'parent'::text)) OR ((r.from_member_id = m.id) AND (r.relationship_type = 'child'::text)) OR ((r.from_member_id = m.id) AND (r.relationship_type = 'spouse'::text)))))
  GROUP BY m.id, m.family_id;

CREATE TABLE public.memories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    era text,
    author_member_id uuid,
    cover_photo_url text,
    audio_url text,
    related_member_ids uuid[] DEFAULT '{}'::uuid[],
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.photo_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    photo_id uuid NOT NULL,
    member_id uuid NOT NULL
);

CREATE TABLE public.photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    album_id uuid NOT NULL,
    family_id uuid NOT NULL,
    url text NOT NULL,
    caption text,
    taken_at date,
    uploaded_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    family_id uuid,
    member_id uuid,
    display_name text NOT NULL,
    email text,
    avatar_url text,
    role text DEFAULT 'family_member'::text NOT NULL,
    invited_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profiles_role_check CHECK ((role = ANY (ARRAY['super_admin'::text, 'family_admin'::text, 'family_member'::text, 'guest'::text])))
);

CREATE TABLE public.recipes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    album_id uuid NOT NULL,
    family_id uuid NOT NULL,
    title text NOT NULL,
    category text NOT NULL,
    is_vegetarian boolean DEFAULT false NOT NULL,
    photo_url text,
    ingredients text[] DEFAULT '{}'::text[] NOT NULL,
    instructions text[] DEFAULT '{}'::text[] NOT NULL,
    cook_time text,
    family_story text,
    contributed_by_member_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT recipes_category_check CHECK ((category = ANY (ARRAY['breakfast'::text, 'main'::text, 'snacks'::text, 'desserts'::text])))
);

CREATE TABLE public.restoration_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    redeemed_at timestamp with time zone
);

CREATE TABLE public.trivia_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    player_name text NOT NULL,
    category text NOT NULL,
    score integer NOT NULL,
    total_questions integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT trivia_scores_category_check CHECK ((category = ANY (ARRAY['our_family'::text, 'history'::text, 'geography'::text]))),
    CONSTRAINT trivia_scores_score_check CHECK ((score >= 0)),
    CONSTRAINT trivia_scores_total_questions_check CHECK ((total_questions > 0))
);

--
-- Primary keys / unique constraints
--

ALTER TABLE ONLY public.albums ADD CONSTRAINT albums_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.announcements ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.audit_log ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.biographies ADD CONSTRAINT biographies_member_id_key UNIQUE (member_id);
ALTER TABLE ONLY public.biographies ADD CONSTRAINT biographies_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chronicle_eras ADD CONSTRAINT chronicle_eras_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cookbook_albums ADD CONSTRAINT cookbook_albums_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.event_rsvps ADD CONSTRAINT event_rsvps_event_id_member_id_key UNIQUE (event_id, member_id);
ALTER TABLE ONLY public.event_rsvps ADD CONSTRAINT event_rsvps_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.events ADD CONSTRAINT events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.families ADD CONSTRAINT families_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.game_scores ADD CONSTRAINT game_scores_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.invitation_codes ADD CONSTRAINT invitation_codes_code_key UNIQUE (code);
ALTER TABLE ONLY public.invitation_codes ADD CONSTRAINT invitation_codes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.language_entries ADD CONSTRAINT language_entries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.legacy_contribution_tags ADD CONSTRAINT legacy_contribution_tags_contribution_id_member_id_key UNIQUE (contribution_id, member_id);
ALTER TABLE ONLY public.legacy_contribution_tags ADD CONSTRAINT legacy_contribution_tags_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.legacy_contributions ADD CONSTRAINT legacy_contributions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.members ADD CONSTRAINT members_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.memories ADD CONSTRAINT memories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.photo_tags ADD CONSTRAINT photo_tags_photo_id_member_id_key UNIQUE (photo_id, member_id);
ALTER TABLE ONLY public.photo_tags ADD CONSTRAINT photo_tags_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.photos ADD CONSTRAINT photos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.recipes ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.relationships ADD CONSTRAINT relationships_from_member_id_to_member_id_relationship_type_key UNIQUE (from_member_id, to_member_id, relationship_type);
ALTER TABLE ONLY public.relationships ADD CONSTRAINT relationships_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.restoration_codes ADD CONSTRAINT restoration_codes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.trivia_scores ADD CONSTRAINT trivia_scores_pkey PRIMARY KEY (id);

--
-- Indexes
--

CREATE INDEX idx_audit_family ON public.audit_log USING btree (family_id, created_at DESC);
CREATE INDEX idx_biographies_family ON public.biographies USING btree (family_id);
CREATE INDEX idx_game_scores_family ON public.game_scores USING btree (family_id);
CREATE INDEX idx_game_scores_profile ON public.game_scores USING btree (family_id, profile_id);
CREATE INDEX idx_language_entries_family ON public.language_entries USING btree (family_id);
CREATE INDEX idx_legacy_contribution_tags_member ON public.legacy_contribution_tags USING btree (member_id);
CREATE INDEX idx_legacy_contributions_member ON public.legacy_contributions USING btree (member_id);
CREATE INDEX idx_members_family ON public.members USING btree (family_id);
CREATE INDEX idx_members_generation ON public.members USING btree (family_id, generation);
CREATE INDEX idx_photo_tags_member ON public.photo_tags USING btree (member_id);
CREATE INDEX idx_photos_album ON public.photos USING btree (album_id);
CREATE INDEX idx_recipes_album ON public.recipes USING btree (album_id);
CREATE INDEX idx_rel_family ON public.relationships USING btree (family_id);
CREATE INDEX idx_rel_from ON public.relationships USING btree (from_member_id);
CREATE INDEX idx_rel_to ON public.relationships USING btree (to_member_id);
CREATE INDEX idx_restoration_codes_profile ON public.restoration_codes USING btree (profile_id);
CREATE INDEX idx_trivia_scores_category ON public.trivia_scores USING btree (family_id, category);
CREATE INDEX idx_trivia_scores_family ON public.trivia_scores USING btree (family_id);

--
-- Foreign keys
--

ALTER TABLE ONLY public.albums ADD CONSTRAINT albums_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.albums ADD CONSTRAINT albums_featured_member_id_fkey FOREIGN KEY (featured_member_id) REFERENCES public.members(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.announcements ADD CONSTRAINT announcements_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.announcements ADD CONSTRAINT announcements_posted_by_member_id_fkey FOREIGN KEY (posted_by_member_id) REFERENCES public.members(id);
ALTER TABLE ONLY public.audit_log ADD CONSTRAINT audit_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id);
ALTER TABLE ONLY public.audit_log ADD CONSTRAINT audit_log_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.biographies ADD CONSTRAINT biographies_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.biographies ADD CONSTRAINT biographies_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.biographies ADD CONSTRAINT biographies_updated_by_profile_id_fkey FOREIGN KEY (updated_by_profile_id) REFERENCES public.profiles(id);
ALTER TABLE ONLY public.chronicle_eras ADD CONSTRAINT chronicle_eras_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cookbook_albums ADD CONSTRAINT cookbook_albums_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cookbook_albums ADD CONSTRAINT cookbook_albums_featured_member_id_fkey FOREIGN KEY (featured_member_id) REFERENCES public.members(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.event_rsvps ADD CONSTRAINT event_rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.event_rsvps ADD CONSTRAINT event_rsvps_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id);
ALTER TABLE ONLY public.event_rsvps ADD CONSTRAINT event_rsvps_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id);
ALTER TABLE ONLY public.events ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
ALTER TABLE ONLY public.events ADD CONSTRAINT events_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.game_scores ADD CONSTRAINT game_scores_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.game_scores ADD CONSTRAINT game_scores_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.invitation_codes ADD CONSTRAINT invitation_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
ALTER TABLE ONLY public.invitation_codes ADD CONSTRAINT invitation_codes_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.invitation_codes ADD CONSTRAINT invitation_codes_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id);
ALTER TABLE ONLY public.invitation_codes ADD CONSTRAINT invitation_codes_redeemed_by_fkey FOREIGN KEY (redeemed_by) REFERENCES public.profiles(id);
ALTER TABLE ONLY public.language_entries ADD CONSTRAINT language_entries_contributed_by_profile_id_fkey FOREIGN KEY (contributed_by_profile_id) REFERENCES public.profiles(id);
ALTER TABLE ONLY public.language_entries ADD CONSTRAINT language_entries_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.language_entries ADD CONSTRAINT language_entries_said_by_member_id_fkey FOREIGN KEY (said_by_member_id) REFERENCES public.members(id);
ALTER TABLE ONLY public.legacy_contribution_tags ADD CONSTRAINT legacy_contribution_tags_contribution_id_fkey FOREIGN KEY (contribution_id) REFERENCES public.legacy_contributions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.legacy_contribution_tags ADD CONSTRAINT legacy_contribution_tags_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.legacy_contributions ADD CONSTRAINT legacy_contributions_author_profile_id_fkey FOREIGN KEY (author_profile_id) REFERENCES public.profiles(id);
ALTER TABLE ONLY public.legacy_contributions ADD CONSTRAINT legacy_contributions_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.legacy_contributions ADD CONSTRAINT legacy_contributions_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.members ADD CONSTRAINT members_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.memories ADD CONSTRAINT memories_author_member_id_fkey FOREIGN KEY (author_member_id) REFERENCES public.members(id);
ALTER TABLE ONLY public.memories ADD CONSTRAINT memories_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.photo_tags ADD CONSTRAINT photo_tags_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.photo_tags ADD CONSTRAINT photo_tags_photo_id_fkey FOREIGN KEY (photo_id) REFERENCES public.photos(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.photos ADD CONSTRAINT photos_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.photos ADD CONSTRAINT photos_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.photos ADD CONSTRAINT photos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id);
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;

-- NOTE: original Supabase schema had:
--   ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_id_fkey
--     FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
-- auth.users doesn't exist on Neon. Since your worker's auth.js has its own
-- "users" table, this now points there instead. Confirm this matches your
-- intended design before running data inserts that rely on it.
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id);
ALTER TABLE ONLY public.recipes ADD CONSTRAINT recipes_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.cookbook_albums(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.recipes ADD CONSTRAINT recipes_contributed_by_member_id_fkey FOREIGN KEY (contributed_by_member_id) REFERENCES public.members(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.recipes ADD CONSTRAINT recipes_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.relationships ADD CONSTRAINT relationships_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.relationships ADD CONSTRAINT relationships_from_member_id_fkey FOREIGN KEY (from_member_id) REFERENCES public.members(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.relationships ADD CONSTRAINT relationships_to_member_id_fkey FOREIGN KEY (to_member_id) REFERENCES public.members(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.restoration_codes ADD CONSTRAINT restoration_codes_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.restoration_codes ADD CONSTRAINT restoration_codes_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.trivia_scores ADD CONSTRAINT trivia_scores_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.trivia_scores ADD CONSTRAINT trivia_scores_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
