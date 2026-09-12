-- Migration: adds the Family Cookbook feature — cookbook albums (e.g. the
-- "Traditional Family Cookbook") and the recipes inside them, organized into
-- four sections (Breakfast, Main meals, Snacks, Desserts) shown as masonry
-- slides in the app, plus an independent "vegetarian" flag rendered as a
-- star badge on the recipe card. Mirrors the existing albums/photos shape:
-- one album can hold many recipes, deleting the album cascades to its
-- recipes, and both tables plug into the same generic per-family RLS policy
-- used by every other content table.
--
-- Run this in the Supabase SQL Editor against an existing project. Safe to
-- re-run (idempotent). Fresh projects can just run schema.sql, which already
-- includes this.

create table if not exists cookbook_albums (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  title text not null,
  style text not null default 'traditional'
    check (style in ('traditional')),
  description text,
  cover_photo_url text,
  featured_member_id uuid references members(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references cookbook_albums(id) on delete cascade,
  family_id uuid not null references families(id) on delete cascade,
  title text not null,
  category text not null
    check (category in ('breakfast','main','snacks','desserts')),
  is_vegetarian boolean not null default false,
  photo_url text,
  ingredients text[] not null default '{}',
  instructions text[] not null default '{}',
  family_story text,
  contributed_by_member_id uuid references members(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_recipes_album on recipes(album_id);

alter table cookbook_albums enable row level security;
alter table recipes enable row level security;

-- Same generic per-family read/write policy as every other content table
-- (see the do $$ ... $$ loop in schema.sql) — reapplied here individually so
-- this migration can run standalone against an existing project.
do $$
declare
  t text;
begin
  foreach t in array array['cookbook_albums','recipes']
  loop
    execute format($f$ drop policy if exists %I_select on %I; $f$, t, t);
    execute format($f$ drop policy if exists %I_insert on %I; $f$, t, t);
    execute format($f$ drop policy if exists %I_update on %I; $f$, t, t);
    execute format($f$ drop policy if exists %I_delete on %I; $f$, t, t);

    execute format($f$
      create policy %I_select on %I for select
        using (family_id = current_family_id());
    $f$, t, t);
    execute format($f$
      create policy %I_insert on %I for insert
        with check (family_id = current_family_id() and current_role_can_add());
    $f$, t, t);
    execute format($f$
      create policy %I_update on %I for update
        using (family_id = current_family_id() and current_role_can_add());
    $f$, t, t);
    execute format($f$
      create policy %I_delete on %I for delete
        using (family_id = current_family_id() and current_role_is_admin());
    $f$, t, t);
  end loop;
end $$;
