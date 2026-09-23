--
-- Fix: the Legacy Link schema's "recipes" table collided with an existing
-- "recipes" table already in this database (a separate feature you built).
-- Renamed to "family_recipes" to avoid the clash.
--

CREATE TABLE public.family_recipes (
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
    CONSTRAINT family_recipes_category_check CHECK ((category = ANY (ARRAY['breakfast'::text, 'main'::text, 'snacks'::text, 'desserts'::text])))
);

ALTER TABLE ONLY public.family_recipes ADD CONSTRAINT family_recipes_pkey PRIMARY KEY (id);

CREATE INDEX idx_family_recipes_album ON public.family_recipes USING btree (album_id);

ALTER TABLE ONLY public.family_recipes ADD CONSTRAINT family_recipes_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.cookbook_albums(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.family_recipes ADD CONSTRAINT family_recipes_contributed_by_member_id_fkey FOREIGN KEY (contributed_by_member_id) REFERENCES public.members(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.family_recipes ADD CONSTRAINT family_recipes_family_id_fkey FOREIGN KEY (family_id) REFERENCES public.families(id) ON DELETE CASCADE;
