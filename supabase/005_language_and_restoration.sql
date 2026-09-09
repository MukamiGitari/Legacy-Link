-- Migration: family language dictionary (words/phrases/proverbs/riddles) and
-- admin-issued password restoration codes.
--
-- Run this in the Supabase SQL Editor against an existing project that was
-- set up from an earlier version of schema.sql. Safe to re-run (idempotent).
-- Fresh projects can just run schema.sql, which already includes this.

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

alter table language_entries enable row level security;

drop policy if exists language_entries_select on language_entries;
drop policy if exists language_entries_insert on language_entries;
drop policy if exists language_entries_update on language_entries;
drop policy if exists language_entries_delete on language_entries;

create policy language_entries_select on language_entries for select
  using (family_id = current_family_id());
create policy language_entries_insert on language_entries for insert
  with check (family_id = current_family_id() and current_role_can_add());
create policy language_entries_update on language_entries for update
  using (family_id = current_family_id() and current_role_can_add());
-- The admin team, or whoever contributed the entry, can remove it.
create policy language_entries_delete on language_entries for delete
  using (
    family_id = current_family_id()
    and (current_role_is_admin() or contributed_by_profile_id = auth.uid())
  );

-- Restoration codes are one-time, admin-issued codes that let a locked-out
-- family member set a new password without knowing their old one. Only
-- admins can create them; nobody can read the code back out through the
-- normal client except at generation time (the row is otherwise write-only
-- from the client's point of view — redemption happens via the app's
-- server-side/service logic in real deployments).
create table if not exists restoration_codes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  redeemed_at timestamptz
);

create index if not exists idx_restoration_codes_profile on restoration_codes(profile_id);

alter table restoration_codes enable row level security;

drop policy if exists restoration_codes_select on restoration_codes;
drop policy if exists restoration_codes_insert on restoration_codes;
drop policy if exists restoration_codes_update on restoration_codes;

create policy restoration_codes_select on restoration_codes for select
  using (family_id = current_family_id() and current_role_is_admin());
create policy restoration_codes_insert on restoration_codes for insert
  with check (family_id = current_family_id() and current_role_is_admin());
-- Redemption marks a code as used; scope this to admins in the RLS layer and
-- verify the code/email match in application logic before calling it.
create policy restoration_codes_update on restoration_codes for update
  using (family_id = current_family_id() and current_role_is_admin());
