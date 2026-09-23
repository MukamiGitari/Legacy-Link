--
-- PostgreSQL database dump
--

\restrict CA1vfuWLsmEXvHB9Z9TuPEperddOiVLUWKKlgV6CyZfoLst3cecmfhPULLQsdih

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: create_super_admin(uuid, uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_super_admin(p_user_id uuid, p_family_id uuid, p_display_name text, p_email text DEFAULT NULL::text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles (id, family_id, display_name, email, role)
  values (p_user_id, p_family_id, p_display_name, p_email, 'super_admin')
  on conflict (id) do update
    set role         = 'super_admin',
        family_id    = excluded.family_id,
        display_name = excluded.display_name,
        email        = coalesce(excluded.email, profiles.email);
end;
$$;


--
-- Name: current_family_id(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_family_id() RETURNS uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select family_id from public.profiles where id = auth.uid()
$$;


--
-- Name: current_role_can_add(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_role_can_add() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role != 'guest'
  )
$$;


--
-- Name: current_role_is_admin(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_role_is_admin() RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('super_admin', 'family_admin')
  )
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: albums; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.albums (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    title text NOT NULL,
    category text DEFAULT 'holidays'::text NOT NULL,
    description text,
    cover_photo_url text,
    featured_member_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT albums_category_check CHECK ((category = ANY (ARRAY['weddings'::text, 'reunions'::text, 'childhood'::text, 'historical'::text, 'memorials'::text, 'holidays'::text, 'birthdays'::text, 'graduations'::text])))
);


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: audit_log; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: biographies; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: chronicle_eras; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: cookbook_albums; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: event_rsvps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_rsvps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    member_id uuid,
    profile_id uuid,
    status text DEFAULT 'invited'::text NOT NULL,
    responded_at timestamp with time zone,
    CONSTRAINT event_rsvps_status_check CHECK ((status = ANY (ARRAY['invited'::text, 'going'::text, 'maybe'::text, 'declined'::text])))
);


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: families; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: game_scores; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: invitation_codes; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: language_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.language_entries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    entry_type text NOT NULL,
    term text NOT NULL,
    meaning text NOT NULL,
    answer text,
    said_by_member_id uuid,
    contributed_by_profile_id uuid,
    contributed_by_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT language_entries_entry_type_check CHECK ((entry_type = ANY (ARRAY['word'::text, 'phrase'::text, 'proverb'::text, 'riddle'::text, 'saying'::text])))
);


--
-- Name: legacy_contribution_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legacy_contribution_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    contribution_id uuid NOT NULL,
    member_id uuid NOT NULL
);


--
-- Name: legacy_contributions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.legacy_contributions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    member_id uuid NOT NULL,
    author_profile_id uuid,
    author_name text NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: members; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: relationships; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: member_lineage; Type: VIEW; Schema: public; Owner: -
--

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


--
-- Name: memories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.memories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    era text,
    author_member_id uuid,
    cover_photo_url text,
    related_member_ids uuid[] DEFAULT '{}'::uuid[],
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: photo_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.photo_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    photo_id uuid NOT NULL,
    member_id uuid NOT NULL
);


--
-- Name: photos; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: recipes; Type: TABLE; Schema: public; Owner: -
--

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


--
-- Name: restoration_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.restoration_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    family_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    redeemed_at timestamp with time zone
);


--
-- Name: trivia_scores; Type: TABLE; Schema: public; Owner: -
--

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
-- Name: albums albums_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.albums
    ADD CONSTRAINT albums_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: audit_log audit_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_pkey PRIMARY KEY (id);


--
-- Name: biographies biographies_member_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biographies
    ADD CONSTRAINT biographies_member_id_key UNIQUE (member_id);


--
-- Name: biographies biographies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biographies
    ADD CONSTRAINT biographies_pkey PRIMARY KEY (id);


--
-- Name: chronicle_eras chronicle_eras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chronicle_eras
    ADD CONSTRAINT chronicle_eras_pkey PRIMARY KEY (id);


--
-- Name: cookbook_albums cookbook_albums_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cookbook_albums
    ADD CONSTRAINT cookbook_albums_pkey PRIMARY KEY (id);


--
-- Name: event_rsvps event_rsvps_event_id_member_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_event_id_member_id_key UNIQUE (event_id, member_id);


--
-- Name: event_rsvps event_rsvps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: families families_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.families
    ADD CONSTRAINT families_pkey PRIMARY KEY (id);


--
-- Name: game_scores game_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_scores
    ADD CONSTRAINT game_scores_pkey PRIMARY KEY (id);


--
-- Name: invitation_codes invitation_codes_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation_codes
    ADD CONSTRAINT invitation_codes_code_key UNIQUE (code);


--
-- Name: invitation_codes invitation_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation_codes
    ADD CONSTRAINT invitation_codes_pkey PRIMARY KEY (id);


--
-- Name: language_entries language_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.language_entries
    ADD CONSTRAINT language_entries_pkey PRIMARY KEY (id);


--
-- Name: legacy_contribution_tags legacy_contribution_tags_contribution_id_member_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legacy_contribution_tags
    ADD CONSTRAINT legacy_contribution_tags_contribution_id_member_id_key UNIQUE (contribution_id, member_id);


--
-- Name: legacy_contribution_tags legacy_contribution_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legacy_contribution_tags
    ADD CONSTRAINT legacy_contribution_tags_pkey PRIMARY KEY (id);


--
-- Name: legacy_contributions legacy_contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legacy_contributions
    ADD CONSTRAINT legacy_contributions_pkey PRIMARY KEY (id);


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: memories memories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memories
    ADD CONSTRAINT memories_pkey PRIMARY KEY (id);


--
-- Name: photo_tags photo_tags_photo_id_member_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_tags
    ADD CONSTRAINT photo_tags_photo_id_member_id_key UNIQUE (photo_id, member_id);


--
-- Name: photo_tags photo_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_tags
    ADD CONSTRAINT photo_tags_pkey PRIMARY KEY (id);


--
-- Name: photos photos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: recipes recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_pkey PRIMARY KEY (id);


--
-- Name: relationships relationships_from_member_id_to_member_id_relationship_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT relationships_from_member_id_to_member_id_relationship_type_key UNIQUE (from_member_id, to_member_id, relationship_type);


--
-- Name: relationships relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT relationships_pkey PRIMARY KEY (id);


--
-- Name: restoration_codes restoration_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restoration_codes
    ADD CONSTRAINT restoration_codes_pkey PRIMARY KEY (id);


--
-- Name: trivia_scores trivia_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trivia_scores
    ADD CONSTRAINT trivia_scores_pkey PRIMARY KEY (id);


--
-- Name: idx_audit_family; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_family ON public.audit_log USING btree (family_id, created_at DESC);


--
-- Name: idx_biographies_family; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_biographies_family ON public.biographies USING btree (family_id);


--
-- Name: idx_game_scores_family; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_scores_family ON public.game_scores USING btree (family_id);


--
-- Name: idx_game_scores_profile; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_game_scores_profile ON public.game_scores USING btree (family_id, profile_id);


--
-- Name: idx_language_entries_family; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_language_entries_family ON public.language_entries USING btree (family_id);


--
-- Name: idx_legacy_contribution_tags_member; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_legacy_contribution_tags_member ON public.legacy_contribution_tags USING btree (member_id);


--
-- Name: idx_legacy_contributions_member; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_legacy_contributions_member ON public.legacy_contributions USING btree (member_id);


--
-- Name: idx_members_family; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_members_family ON public.members USING btree (family_id);


--
-- Name: idx_members_generation; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_members_generation ON public.members USING btree (family_id, generation);


--
-- Name: idx_photo_tags_member; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_photo_tags_member ON public.photo_tags USING btree (member_id);


--
-- Name: idx_photos_album; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_photos_album ON public.photos USING btree (album_id);


--
-- Name: idx_recipes_album; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recipes_album ON public.recipes USING btree (album_id);


--
-- Name: idx_rel_family; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rel_family ON public.relationships USING btree (family_id);


--
-- Name: idx_rel_from; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rel_from ON public.relationships USING btree (from_member_id);


--
-- Name: idx_rel_to; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rel_to ON public.relationships USING btree (to_member_id);


--
-- Name: idx_restoration_codes_profile; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_restoration_codes_profile ON public.restoration_codes USING btree (profile_id);


--
-- Name: idx_trivia_scores_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trivia_scores_category ON public.trivia_scores USING btree (family_id, category);


--
-- Name: idx_trivia_scores_family; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trivia_scores_family ON public.trivia_scores USING btree (family_id);


--
-- Name: albums albums_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.albums
    ADD CONSTRAINT albums_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: albums albums_featured_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.albums
    ADD CONSTRAINT albums_featured_member_id_fkey FOREIGN KEY (featured_member_id) REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: announcements announcements_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: announcements announcements_posted_by_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_posted_by_member_id_fkey FOREIGN KEY (posted_by_member_id) REFERENCES public.members(id);


--
-- Name: audit_log audit_log_actor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id);


--
-- Name: audit_log audit_log_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_log
    ADD CONSTRAINT audit_log_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: biographies biographies_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biographies
    ADD CONSTRAINT biographies_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: biographies biographies_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biographies
    ADD CONSTRAINT biographies_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: biographies biographies_updated_by_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.biographies
    ADD CONSTRAINT biographies_updated_by_profile_id_fkey FOREIGN KEY (updated_by_profile_id) REFERENCES public.profiles(id);


--
-- Name: chronicle_eras chronicle_eras_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chronicle_eras
    ADD CONSTRAINT chronicle_eras_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: cookbook_albums cookbook_albums_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cookbook_albums
    ADD CONSTRAINT cookbook_albums_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: cookbook_albums cookbook_albums_featured_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cookbook_albums
    ADD CONSTRAINT cookbook_albums_featured_member_id_fkey FOREIGN KEY (featured_member_id) REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: event_rsvps event_rsvps_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_rsvps event_rsvps_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id);


--
-- Name: event_rsvps event_rsvps_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_rsvps
    ADD CONSTRAINT event_rsvps_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id);


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: events events_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: game_scores game_scores_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_scores
    ADD CONSTRAINT game_scores_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: game_scores game_scores_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.game_scores
    ADD CONSTRAINT game_scores_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: invitation_codes invitation_codes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation_codes
    ADD CONSTRAINT invitation_codes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);


--
-- Name: invitation_codes invitation_codes_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation_codes
    ADD CONSTRAINT invitation_codes_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: invitation_codes invitation_codes_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation_codes
    ADD CONSTRAINT invitation_codes_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id);


--
-- Name: invitation_codes invitation_codes_redeemed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitation_codes
    ADD CONSTRAINT invitation_codes_redeemed_by_fkey FOREIGN KEY (redeemed_by) REFERENCES public.profiles(id);


--
-- Name: language_entries language_entries_contributed_by_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.language_entries
    ADD CONSTRAINT language_entries_contributed_by_profile_id_fkey FOREIGN KEY (contributed_by_profile_id) REFERENCES public.profiles(id);


--
-- Name: language_entries language_entries_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.language_entries
    ADD CONSTRAINT language_entries_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: language_entries language_entries_said_by_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.language_entries
    ADD CONSTRAINT language_entries_said_by_member_id_fkey FOREIGN KEY (said_by_member_id) REFERENCES public.members(id);


--
-- Name: legacy_contribution_tags legacy_contribution_tags_contribution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legacy_contribution_tags
    ADD CONSTRAINT legacy_contribution_tags_contribution_id_fkey FOREIGN KEY (contribution_id) REFERENCES public.legacy_contributions(id) ON DELETE CASCADE;


--
-- Name: legacy_contribution_tags legacy_contribution_tags_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legacy_contribution_tags
    ADD CONSTRAINT legacy_contribution_tags_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: legacy_contributions legacy_contributions_author_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legacy_contributions
    ADD CONSTRAINT legacy_contributions_author_profile_id_fkey FOREIGN KEY (author_profile_id) REFERENCES public.profiles(id);


--
-- Name: legacy_contributions legacy_contributions_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legacy_contributions
    ADD CONSTRAINT legacy_contributions_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: legacy_contributions legacy_contributions_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.legacy_contributions
    ADD CONSTRAINT legacy_contributions_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: members members_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: memories memories_author_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memories
    ADD CONSTRAINT memories_author_member_id_fkey FOREIGN KEY (author_member_id) REFERENCES public.members(id);


--
-- Name: memories memories_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.memories
    ADD CONSTRAINT memories_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: photo_tags photo_tags_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_tags
    ADD CONSTRAINT photo_tags_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: photo_tags photo_tags_photo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photo_tags
    ADD CONSTRAINT photo_tags_photo_id_fkey FOREIGN KEY (photo_id) REFERENCES public.photos(id) ON DELETE CASCADE;


--
-- Name: photos photos_album_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id) ON DELETE CASCADE;


--
-- Name: photos photos_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: photos photos_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.photos
    ADD CONSTRAINT photos_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id);


--
-- Name: profiles profiles_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_invited_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES public.profiles(id);


--
-- Name: recipes recipes_album_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.cookbook_albums(id) ON DELETE CASCADE;


--
-- Name: recipes recipes_contributed_by_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_contributed_by_member_id_fkey FOREIGN KEY (contributed_by_member_id) REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: recipes recipes_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recipes
    ADD CONSTRAINT recipes_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: relationships relationships_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT relationships_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: relationships relationships_from_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT relationships_from_member_id_fkey FOREIGN KEY (from_member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: relationships relationships_to_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.relationships
    ADD CONSTRAINT relationships_to_member_id_fkey FOREIGN KEY (to_member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: restoration_codes restoration_codes_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restoration_codes
    ADD CONSTRAINT restoration_codes_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: restoration_codes restoration_codes_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.restoration_codes
    ADD CONSTRAINT restoration_codes_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: trivia_scores trivia_scores_family_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trivia_scores
    ADD CONSTRAINT trivia_scores_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;


--
-- Name: trivia_scores trivia_scores_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trivia_scores
    ADD CONSTRAINT trivia_scores_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: albums; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

--
-- Name: albums albums_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY albums_delete ON public.albums FOR DELETE USING (((family_id = public.current_family_id()) AND public.current_role_is_admin()));


--
-- Name: albums albums_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY albums_insert ON public.albums FOR INSERT WITH CHECK (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: albums albums_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY albums_select ON public.albums FOR SELECT USING ((family_id = public.current_family_id()));


--
-- Name: albums albums_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY albums_update ON public.albums FOR UPDATE USING (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

--
-- Name: announcements announcements_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY announcements_delete ON public.announcements FOR DELETE USING (((family_id = public.current_family_id()) AND public.current_role_is_admin()));


--
-- Name: announcements announcements_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY announcements_insert ON public.announcements FOR INSERT WITH CHECK (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: announcements announcements_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY announcements_select ON public.announcements FOR SELECT USING ((family_id = public.current_family_id()));


--
-- Name: announcements announcements_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY announcements_update ON public.announcements FOR UPDATE USING (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: audit_log; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_log audit_log_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_log_insert ON public.audit_log FOR INSERT WITH CHECK ((family_id = public.current_family_id()));


--
-- Name: audit_log audit_log_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY audit_log_select ON public.audit_log FOR SELECT USING ((family_id = public.current_family_id()));


--
-- Name: biographies; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.biographies ENABLE ROW LEVEL SECURITY;

--
-- Name: biographies biographies_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY biographies_delete ON public.biographies FOR DELETE USING (((family_id = public.current_family_id()) AND public.current_role_is_admin()));


--
-- Name: biographies biographies_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY biographies_insert ON public.biographies FOR INSERT WITH CHECK (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: biographies biographies_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY biographies_select ON public.biographies FOR SELECT USING ((family_id = public.current_family_id()));


--
-- Name: biographies biographies_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY biographies_update ON public.biographies FOR UPDATE USING (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: chronicle_eras; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.chronicle_eras ENABLE ROW LEVEL SECURITY;

--
-- Name: chronicle_eras chronicle_eras_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chronicle_eras_delete ON public.chronicle_eras FOR DELETE USING (((family_id = public.current_family_id()) AND public.current_role_is_admin()));


--
-- Name: chronicle_eras chronicle_eras_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chronicle_eras_insert ON public.chronicle_eras FOR INSERT WITH CHECK (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: chronicle_eras chronicle_eras_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chronicle_eras_select ON public.chronicle_eras FOR SELECT USING ((family_id = public.current_family_id()));


--
-- Name: chronicle_eras chronicle_eras_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY chronicle_eras_update ON public.chronicle_eras FOR UPDATE USING (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: cookbook_albums; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cookbook_albums ENABLE ROW LEVEL SECURITY;

--
-- Name: cookbook_albums cookbook_albums_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cookbook_albums_delete ON public.cookbook_albums FOR DELETE USING (((family_id = public.current_family_id()) AND public.current_role_is_admin()));


--
-- Name: cookbook_albums cookbook_albums_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cookbook_albums_insert ON public.cookbook_albums FOR INSERT WITH CHECK (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: cookbook_albums cookbook_albums_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cookbook_albums_select ON public.cookbook_albums FOR SELECT USING ((family_id = public.current_family_id()));


--
-- Name: cookbook_albums cookbook_albums_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY cookbook_albums_update ON public.cookbook_albums FOR UPDATE USING (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: event_rsvps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

--
-- Name: event_rsvps event_rsvps_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_rsvps_insert ON public.event_rsvps FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = event_rsvps.event_id) AND (e.family_id = public.current_family_id())))));


--
-- Name: event_rsvps event_rsvps_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_rsvps_select ON public.event_rsvps FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = event_rsvps.event_id) AND (e.family_id = public.current_family_id())))));


--
-- Name: event_rsvps event_rsvps_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY event_rsvps_update ON public.event_rsvps FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = event_rsvps.event_id) AND (e.family_id = public.current_family_id())))));


--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

--
-- Name: events events_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_delete ON public.events FOR DELETE USING (((family_id = public.current_family_id()) AND public.current_role_is_admin()));


--
-- Name: events events_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_insert ON public.events FOR INSERT WITH CHECK (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: events events_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_select ON public.events FOR SELECT USING ((family_id = public.current_family_id()));


--
-- Name: events events_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY events_update ON public.events FOR UPDATE USING (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: families; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

--
-- Name: families families_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY families_insert ON public.families FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--
-- Name: families families_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY families_select ON public.families FOR SELECT USING ((id = public.current_family_id()));


--
-- Name: families families_update_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY families_update_admin ON public.families FOR UPDATE USING ((public.current_role_is_admin() AND (id = public.current_family_id())));


--
-- Name: game_scores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: game_scores game_scores_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY game_scores_insert ON public.game_scores FOR INSERT WITH CHECK (((family_id = public.current_family_id()) AND (profile_id = auth.uid())));


--
-- Name: game_scores game_scores_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY game_scores_select ON public.game_scores FOR SELECT USING ((family_id = public.current_family_id()));


--
-- Name: invitation_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.invitation_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: invitation_codes invitation_codes_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY invitation_codes_admin ON public.invitation_codes USING ((public.current_role_is_admin() AND (family_id = public.current_family_id()))) WITH CHECK ((public.current_role_is_admin() AND (family_id = public.current_family_id())));


--
-- Name: language_entries; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.language_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: language_entries language_entries_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY language_entries_delete ON public.language_entries FOR DELETE USING (((family_id = public.current_family_id()) AND (public.current_role_is_admin() OR (contributed_by_profile_id = auth.uid()))));


--
-- Name: language_entries language_entries_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY language_entries_insert ON public.language_entries FOR INSERT WITH CHECK (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: language_entries language_entries_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY language_entries_select ON public.language_entries FOR SELECT USING ((family_id = public.current_family_id()));


--
-- Name: language_entries language_entries_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY language_entries_update ON public.language_entries FOR UPDATE USING (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: legacy_contribution_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.legacy_contribution_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: legacy_contribution_tags legacy_contribution_tags_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY legacy_contribution_tags_delete ON public.legacy_contribution_tags FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.legacy_contributions c
  WHERE ((c.id = legacy_contribution_tags.contribution_id) AND (c.family_id = public.current_family_id())))));


--
-- Name: legacy_contribution_tags legacy_contribution_tags_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY legacy_contribution_tags_insert ON public.legacy_contribution_tags FOR INSERT WITH CHECK ((public.current_role_can_add() AND (EXISTS ( SELECT 1
   FROM public.legacy_contributions c
  WHERE ((c.id = legacy_contribution_tags.contribution_id) AND (c.family_id = public.current_family_id()))))));


--
-- Name: legacy_contribution_tags legacy_contribution_tags_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY legacy_contribution_tags_select ON public.legacy_contribution_tags FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.legacy_contributions c
  WHERE ((c.id = legacy_contribution_tags.contribution_id) AND (c.family_id = public.current_family_id())))));


--
-- Name: legacy_contributions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.legacy_contributions ENABLE ROW LEVEL SECURITY;

--
-- Name: legacy_contributions legacy_contributions_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY legacy_contributions_delete ON public.legacy_contributions FOR DELETE USING (((family_id = public.current_family_id()) AND (public.current_role_is_admin() OR (author_profile_id = auth.uid()))));


--
-- Name: legacy_contributions legacy_contributions_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY legacy_contributions_insert ON public.legacy_contributions FOR INSERT WITH CHECK (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: legacy_contributions legacy_contributions_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY legacy_contributions_select ON public.legacy_contributions FOR SELECT USING ((family_id = public.current_family_id()));


--
-- Name: legacy_contributions legacy_contributions_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY legacy_contributions_update ON public.legacy_contributions FOR UPDATE USING (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

--
-- Name: members members_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY members_delete ON public.members FOR DELETE USING (((family_id = public.current_family_id()) AND public.current_role_is_admin()));


--
-- Name: members members_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY members_insert ON public.members FOR INSERT WITH CHECK (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: members members_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY members_select ON public.members FOR SELECT USING ((family_id = public.current_family_id()));


--
-- Name: members members_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY members_update ON public.members FOR UPDATE USING (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: memories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

--
-- Name: memories memories_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY memories_delete ON public.memories FOR DELETE USING (((family_id = public.current_family_id()) AND public.current_role_is_admin()));


--
-- Name: memories memories_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY memories_insert ON public.memories FOR INSERT WITH CHECK (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: memories memories_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY memories_select ON public.memories FOR SELECT USING ((family_id = public.current_family_id()));


--
-- Name: memories memories_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY memories_update ON public.memories FOR UPDATE USING (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: photo_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.photo_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: photo_tags photo_tags_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY photo_tags_delete ON public.photo_tags FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.photos p
  WHERE ((p.id = photo_tags.photo_id) AND (p.family_id = public.current_family_id())))));


--
-- Name: photo_tags photo_tags_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY photo_tags_insert ON public.photo_tags FOR INSERT WITH CHECK ((public.current_role_can_add() AND (EXISTS ( SELECT 1
   FROM public.photos p
  WHERE ((p.id = photo_tags.photo_id) AND (p.family_id = public.current_family_id()))))));


--
-- Name: photo_tags photo_tags_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY photo_tags_select ON public.photo_tags FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.photos p
  WHERE ((p.id = photo_tags.photo_id) AND (p.family_id = public.current_family_id())))));


--
-- Name: photos; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

--
-- Name: photos photos_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY photos_delete ON public.photos FOR DELETE USING (((family_id = public.current_family_id()) AND public.current_role_is_admin()));


--
-- Name: photos photos_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY photos_insert ON public.photos FOR INSERT WITH CHECK (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: photos photos_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY photos_select ON public.photos FOR SELECT USING ((family_id = public.current_family_id()));


--
-- Name: photos photos_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY photos_update ON public.photos FOR UPDATE USING (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_insert_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_insert_self ON public.profiles FOR INSERT WITH CHECK ((id = auth.uid()));


--
-- Name: profiles profiles_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select ON public.profiles FOR SELECT USING ((family_id = public.current_family_id()));


--
-- Name: profiles profiles_update_admin; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update_admin ON public.profiles FOR UPDATE USING ((public.current_role_is_admin() AND (family_id = public.current_family_id())));


--
-- Name: profiles profiles_update_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE USING ((id = auth.uid()));


--
-- Name: recipes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

--
-- Name: recipes recipes_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recipes_delete ON public.recipes FOR DELETE USING (((family_id = public.current_family_id()) AND public.current_role_is_admin()));


--
-- Name: recipes recipes_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recipes_insert ON public.recipes FOR INSERT WITH CHECK (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: recipes recipes_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recipes_select ON public.recipes FOR SELECT USING ((family_id = public.current_family_id()));


--
-- Name: recipes recipes_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY recipes_update ON public.recipes FOR UPDATE USING (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: relationships; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;

--
-- Name: relationships relationships_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY relationships_delete ON public.relationships FOR DELETE USING (((family_id = public.current_family_id()) AND public.current_role_is_admin()));


--
-- Name: relationships relationships_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY relationships_insert ON public.relationships FOR INSERT WITH CHECK (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: relationships relationships_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY relationships_select ON public.relationships FOR SELECT USING ((family_id = public.current_family_id()));


--
-- Name: relationships relationships_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY relationships_update ON public.relationships FOR UPDATE USING (((family_id = public.current_family_id()) AND public.current_role_can_add()));


--
-- Name: restoration_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.restoration_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: restoration_codes restoration_codes_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY restoration_codes_insert ON public.restoration_codes FOR INSERT WITH CHECK (((family_id = public.current_family_id()) AND public.current_role_is_admin()));


--
-- Name: restoration_codes restoration_codes_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY restoration_codes_select ON public.restoration_codes FOR SELECT USING (((family_id = public.current_family_id()) AND public.current_role_is_admin()));


--
-- Name: restoration_codes restoration_codes_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY restoration_codes_update ON public.restoration_codes FOR UPDATE USING (((family_id = public.current_family_id()) AND public.current_role_is_admin()));


--
-- Name: trivia_scores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trivia_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: trivia_scores trivia_scores_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY trivia_scores_insert ON public.trivia_scores FOR INSERT WITH CHECK (((family_id = public.current_family_id()) AND (profile_id = auth.uid())));


--
-- Name: trivia_scores trivia_scores_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY trivia_scores_select ON public.trivia_scores FOR SELECT USING ((family_id = public.current_family_id()));


--
-- PostgreSQL database dump complete
--

\unrestrict CA1vfuWLsmEXvHB9Z9TuPEperddOiVLUWKKlgV6CyZfoLst3cecmfhPULLQsdih

