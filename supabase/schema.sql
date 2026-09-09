-- ============================================================================
-- Heritage Hub / Legacy Link — Supabase schema
-- Run this whole file in the Supabase SQL Editor on a fresh project.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- families: one row per family archive (a "workspace")
-- ----------------------------------------------------------------------------
create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  motto text,
  origin_story text,
  cover_photo_url text,
  active_tree_template text not null default 'classic'
    check (active_tree_template in ('classic','timeline','photo','radial','minimalist','heritage')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- profiles: app users, linked 1:1 with Supabase auth.users
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid references families(id) on delete cascade,
  member_id uuid, -- optional link to the "members" row that represents this person
  display_name text not null,
  email text,
  avatar_url text,
  role text not null default 'family_member'
    check (role in ('super_admin','family_admin','family_member','guest')),
  invited_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- members: the genealogical record for a person in the tree
-- ----------------------------------------------------------------------------
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  maiden_name text,
  gender text check (gender in ('male','female','other')),
  generation int not null default 1,
  avatar_url text,
  is_living boolean not null default true,
  date_of_birth date,
  date_of_passing date,
  birth_place text,
  resting_place text,
  occupation text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_members_family on members(family_id);
create index if not exists idx_members_generation on members(family_id, generation);

-- ----------------------------------------------------------------------------
-- relationships: directed edges between members
-- relationship_type is read from `from_member` -> `to_member`
-- e.g. from=parent, to=child, type='parent'
-- ----------------------------------------------------------------------------
create table if not exists relationships (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  from_member_id uuid not null references members(id) on delete cascade,
  to_member_id uuid not null references members(id) on delete cascade,
  relationship_type text not null
    check (relationship_type in ('parent','child','spouse','sibling','adoptive_parent','adoptive_child','step_parent','step_child')),
  started_at date, -- e.g. marriage date for spouse relationships
  ended_at date,
  created_at timestamptz not null default now(),
  unique (from_member_id, to_member_id, relationship_type)
);

create index if not exists idx_rel_family on relationships(family_id);
create index if not exists idx_rel_from on relationships(from_member_id);
create index if not exists idx_rel_to on relationships(to_member_id);

-- ----------------------------------------------------------------------------
-- albums + photos: family media archive
-- ----------------------------------------------------------------------------
create table if not exists albums (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  title text not null,
  category text not null default 'holidays'
    check (category in ('weddings','reunions','childhood','historical','memorials','holidays')),
  description text,
  cover_photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references albums(id) on delete cascade,
  family_id uuid not null references families(id) on delete cascade,
  url text not null,
  caption text,
  taken_at date,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists photo_tags (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references photos(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  unique (photo_id, member_id)
);

create index if not exists idx_photos_album on photos(album_id);
create index if not exists idx_photo_tags_member on photo_tags(member_id);

-- ----------------------------------------------------------------------------
-- Storage: real photo/avatar uploads instead of base64 data URLs.
-- Photos are uploaded to the `family-photos` bucket under paths shaped
-- `<family_id>/<album_id>/<uuid>.<ext>` (or `<family_id>/avatars/...` for
-- profile/member photos), matching uploadPhotoFile()/uploadAvatarFile() in
-- src/lib/db.ts. The bucket is public for reads (so `<img src="...">` works
-- directly without signed URLs), but writes are scoped to members of that
-- family, and — same rule as every other content table — the Guest role
-- cannot write.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('family-photos', 'family-photos', true)
on conflict (id) do update set public = true;

-- ----------------------------------------------------------------------------
-- memories: storytelling entries, optionally with photos + author attribution
-- ----------------------------------------------------------------------------
create table if not exists memories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  title text not null,
  body text not null,
  era text, -- e.g. "1960s"
  author_member_id uuid references members(id),
  cover_photo_url text,
  related_member_ids uuid[] default '{}',
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- events: calendar with RSVP tracking
-- ----------------------------------------------------------------------------
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  title text not null,
  event_type text not null default 'reunion'
    check (event_type in ('reunion','birthday','memorial','meeting','other')),
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  member_id uuid references members(id),
  profile_id uuid references profiles(id),
  status text not null default 'invited'
    check (status in ('invited','going','maybe','declined')),
  responded_at timestamptz,
  unique (event_id, member_id)
);

-- ----------------------------------------------------------------------------
-- announcements: broadcast noticeboard
-- ----------------------------------------------------------------------------
create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  title text not null,
  body text not null,
  priority text not null default 'normal'
    check (priority in ('urgent','important','normal')),
  posted_by_member_id uuid references members(id),
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- chronicle_eras: the multi-era family history timeline
-- ----------------------------------------------------------------------------
create table if not exists chronicle_eras (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  era_label text not null, -- e.g. "1890s – Origins"
  sort_order int not null default 0,
  headline text not null,
  narrative text,
  photo_url text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- biographies: one structured, 8-section life story per member
-- (the flat `members.bio` column above remains as a lightweight fallback)
-- ----------------------------------------------------------------------------
create table if not exists biographies (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade unique,
  at_a_glance text,
  early_life_family text,
  young_adulthood text,
  marriage_family_life text,
  work_achievements_passions text,
  stories_memories_title text,
  stories_memories text,
  later_years text,
  legacy text,
  updated_by_profile_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_biographies_family on biographies(family_id);

-- ----------------------------------------------------------------------------
-- legacy_contributions: crowd-sourced memories/tributes relatives add to a
-- member's Legacy section, optionally tagging other members in the story
-- ----------------------------------------------------------------------------
create table if not exists legacy_contributions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  author_profile_id uuid references profiles(id),
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists legacy_contribution_tags (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references legacy_contributions(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  unique (contribution_id, member_id)
);

create index if not exists idx_legacy_contributions_member on legacy_contributions(member_id);
create index if not exists idx_legacy_contribution_tags_member on legacy_contribution_tags(member_id);

-- ----------------------------------------------------------------------------
-- language_entries: crowd-sourced family language dictionary — words, phrases,
-- proverbs, riddles, and sayings, each contributed by a family member along
-- with its meaning (and, for riddles, the traditional answer; for sayings,
-- which member is remembered for saying it).
-- ----------------------------------------------------------------------------
create table if not exists language_entries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  entry_type text not null check (entry_type in ('word', 'phrase', 'proverb', 'riddle', 'saying')),
  term text not null,
  meaning text not null,
  answer text,
  said_by_member_id uuid references members(id),
  contributed_by_profile_id uuid references profiles(id),
  contributed_by_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_language_entries_family on language_entries(family_id);

-- ----------------------------------------------------------------------------
-- restoration_codes: one-time, admin-issued codes that let a locked-out family
-- member set a new password without knowing their old one.
-- ----------------------------------------------------------------------------
create table if not exists restoration_codes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  redeemed_at timestamptz
);

create index if not exists idx_restoration_codes_profile on restoration_codes(profile_id);

-- ----------------------------------------------------------------------------
-- invitation_codes: admin-generated invite codes for onboarding new members
-- ----------------------------------------------------------------------------
create table if not exists invitation_codes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  code text not null unique,
  role text not null default 'family_member'
    check (role in ('family_admin','family_member','guest')),
  member_id uuid references members(id), -- pre-linked person, optional
  created_by uuid references profiles(id),
  redeemed_by uuid references profiles(id),
  redeemed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- audit_log: system activity trail
-- ----------------------------------------------------------------------------
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  actor_id uuid references profiles(id),
  action text not null, -- e.g. "member.created", "photo.uploaded"
  entity_type text not null,
  entity_id uuid,
  details jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_family on audit_log(family_id, created_at desc);

-- ============================================================================
-- Row Level Security
-- Simple model: a profile may only read/write rows in their own family_id.
-- Admin-only tables restrict writes to family_admin / super_admin roles.
-- ============================================================================

alter table families enable row level security;
alter table profiles enable row level security;
alter table members enable row level security;
alter table relationships enable row level security;
alter table albums enable row level security;
alter table photos enable row level security;
alter table photo_tags enable row level security;
alter table memories enable row level security;
alter table events enable row level security;
alter table event_rsvps enable row level security;
alter table announcements enable row level security;
alter table chronicle_eras enable row level security;
alter table biographies enable row level security;
alter table legacy_contributions enable row level security;
alter table legacy_contribution_tags enable row level security;
alter table language_entries enable row level security;
alter table restoration_codes enable row level security;
alter table invitation_codes enable row level security;
alter table audit_log enable row level security;

create or replace function current_family_id()
returns uuid
language sql stable
as $$
  select family_id from profiles where id = auth.uid()
$$;

create or replace function current_role_is_admin()
returns boolean
language sql stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('super_admin','family_admin')
  )
$$;

-- Guests are read-only: every other role (family_member, family_admin, super_admin)
-- may add and edit content, matching canAddContent() in src/lib/permissions.ts.
create or replace function current_role_can_add()
returns boolean
language sql stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role != 'guest'
  )
$$;

-- profiles: a user can see other profiles in their family; can only edit self (admins can edit any in-family)
drop policy if exists profiles_select on profiles;
drop policy if exists profiles_update_self on profiles;
drop policy if exists profiles_update_admin on profiles;
create policy profiles_select on profiles for select
  using (family_id = current_family_id());
create policy profiles_update_self on profiles for update
  using (id = auth.uid());
create policy profiles_update_admin on profiles for update
  using (current_role_is_admin() and family_id = current_family_id());

-- families: members can read their own family; only admins can update it
drop policy if exists families_select on families;
drop policy if exists families_update_admin on families;
create policy families_select on families for select
  using (id = current_family_id());
create policy families_update_admin on families for update
  using (current_role_is_admin() and id = current_family_id());

-- generic per-family read/write policy, applied to each content table
do $$
declare
  t text;
begin
  foreach t in array array[
    'members','relationships','albums','photos','photo_tags',
    'memories','events','event_rsvps','announcements','chronicle_eras',
    'biographies','legacy_contributions','language_entries'
  ]
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

-- legacy_contributions: relax the generic admin-only delete policy so the
-- original author can also remove their own memory (mirrors
-- canRemoveLegacyContribution() in src/lib/permissions.ts).
drop policy if exists legacy_contributions_delete on legacy_contributions;
create policy legacy_contributions_delete on legacy_contributions for delete
  using (
    family_id = current_family_id()
    and (current_role_is_admin() or author_profile_id = auth.uid())
  );

-- language_entries: same relaxation — the admin team, or whoever contributed
-- the entry, can remove it.
drop policy if exists language_entries_delete on language_entries;
create policy language_entries_delete on language_entries for delete
  using (
    family_id = current_family_id()
    and (current_role_is_admin() or contributed_by_profile_id = auth.uid())
  );

-- restoration_codes: admin-only in every direction. Only admins can mint a
-- code or see which ones exist; redemption (matching + marking used) happens
-- in application logic after verifying the code/email pair out of band, and
-- is applied here as an admin-scoped update.
drop policy if exists restoration_codes_select on restoration_codes;
drop policy if exists restoration_codes_insert on restoration_codes;
drop policy if exists restoration_codes_update on restoration_codes;

create policy restoration_codes_select on restoration_codes for select
  using (family_id = current_family_id() and current_role_is_admin());
create policy restoration_codes_insert on restoration_codes for insert
  with check (family_id = current_family_id() and current_role_is_admin());
create policy restoration_codes_update on restoration_codes for update
  using (family_id = current_family_id() and current_role_is_admin());

-- photo_tags and event_rsvps don't carry family_id directly in the loop above's
-- assumption path for photo_tags — patch: derive via photo/event join instead.
drop policy if exists photo_tags_select on photo_tags;
drop policy if exists photo_tags_insert on photo_tags;
drop policy if exists photo_tags_update on photo_tags;
drop policy if exists photo_tags_delete on photo_tags;

create policy photo_tags_select on photo_tags for select
  using (exists (select 1 from photos p where p.id = photo_id and p.family_id = current_family_id()));
create policy photo_tags_insert on photo_tags for insert
  with check (current_role_can_add() and exists (select 1 from photos p where p.id = photo_id and p.family_id = current_family_id()));
create policy photo_tags_delete on photo_tags for delete
  using (exists (select 1 from photos p where p.id = photo_id and p.family_id = current_family_id()));

-- legacy_contribution_tags: same shape as photo_tags — derive family scope via the parent contribution.
drop policy if exists legacy_contribution_tags_select on legacy_contribution_tags;
drop policy if exists legacy_contribution_tags_insert on legacy_contribution_tags;
drop policy if exists legacy_contribution_tags_delete on legacy_contribution_tags;

create policy legacy_contribution_tags_select on legacy_contribution_tags for select
  using (exists (select 1 from legacy_contributions c where c.id = contribution_id and c.family_id = current_family_id()));
create policy legacy_contribution_tags_insert on legacy_contribution_tags for insert
  with check (current_role_can_add() and exists (select 1 from legacy_contributions c where c.id = contribution_id and c.family_id = current_family_id()));
create policy legacy_contribution_tags_delete on legacy_contribution_tags for delete
  using (exists (select 1 from legacy_contributions c where c.id = contribution_id and c.family_id = current_family_id()));

drop policy if exists event_rsvps_select on event_rsvps;
drop policy if exists event_rsvps_insert on event_rsvps;
drop policy if exists event_rsvps_update on event_rsvps;
drop policy if exists event_rsvps_delete on event_rsvps;

create policy event_rsvps_select on event_rsvps for select
  using (exists (select 1 from events e where e.id = event_id and e.family_id = current_family_id()));
create policy event_rsvps_insert on event_rsvps for insert
  with check (exists (select 1 from events e where e.id = event_id and e.family_id = current_family_id()));
create policy event_rsvps_update on event_rsvps for update
  using (exists (select 1 from events e where e.id = event_id and e.family_id = current_family_id()));

-- invitation_codes / audit_log: admin only, scoped to family
create policy invitation_codes_admin on invitation_codes for all
  using (current_role_is_admin() and family_id = current_family_id())
  with check (current_role_is_admin() and family_id = current_family_id());

create policy audit_log_select on audit_log for select
  using (family_id = current_family_id());
create policy audit_log_insert on audit_log for insert
  with check (family_id = current_family_id());

-- family-photos storage bucket: public read, family-scoped writes (see the
-- bucket creation near the photos table above for the path convention).
drop policy if exists "family_photos_public_read" on storage.objects;
drop policy if exists "family_photos_family_insert" on storage.objects;
drop policy if exists "family_photos_family_delete" on storage.objects;

create policy "family_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'family-photos');

create policy "family_photos_family_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'family-photos'
    and current_role_can_add()
    and (storage.foldername(name))[1] = current_family_id()::text
  );

create policy "family_photos_family_delete"
  on storage.objects for delete
  using (
    bucket_id = 'family-photos'
    and current_role_is_admin()
    and (storage.foldername(name))[1] = current_family_id()::text
  );

-- ============================================================================
-- Helpful view: flattened lineage (parents + children) per member
-- ============================================================================
create or replace view member_lineage as
select
  m.id as member_id,
  m.family_id,
  array_remove(array_agg(distinct case when r.relationship_type = 'parent' then r.from_member_id end), null) as parent_ids,
  array_remove(array_agg(distinct case when r.relationship_type = 'child' then r.to_member_id end), null) as child_ids,
  array_remove(array_agg(distinct case when r.relationship_type = 'spouse' then r.to_member_id end), null) as spouse_ids
from members m
left join relationships r
  on (r.to_member_id = m.id and r.relationship_type = 'parent')
  or (r.from_member_id = m.id and r.relationship_type = 'child')
  or (r.from_member_id = m.id and r.relationship_type = 'spouse')
group by m.id, m.family_id;
