-- Migration: structured member biographies + crowd-sourced Legacy memories.
--
-- Run this in the Supabase SQL Editor against an existing project that was
-- set up from an earlier version of schema.sql. Safe to re-run (idempotent).
-- Fresh projects can just run schema.sql, which already includes this.

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

alter table biographies enable row level security;
alter table legacy_contributions enable row level security;
alter table legacy_contribution_tags enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['biographies', 'legacy_contributions']
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

-- Let the original author of a legacy memory delete it too, not just admins.
drop policy if exists legacy_contributions_delete on legacy_contributions;
create policy legacy_contributions_delete on legacy_contributions for delete
  using (
    family_id = current_family_id()
    and (current_role_is_admin() or author_profile_id = auth.uid())
  );

drop policy if exists legacy_contribution_tags_select on legacy_contribution_tags;
drop policy if exists legacy_contribution_tags_insert on legacy_contribution_tags;
drop policy if exists legacy_contribution_tags_delete on legacy_contribution_tags;

create policy legacy_contribution_tags_select on legacy_contribution_tags for select
  using (exists (select 1 from legacy_contributions c where c.id = contribution_id and c.family_id = current_family_id()));
create policy legacy_contribution_tags_insert on legacy_contribution_tags for insert
  with check (current_role_can_add() and exists (select 1 from legacy_contributions c where c.id = contribution_id and c.family_id = current_family_id()));
create policy legacy_contribution_tags_delete on legacy_contribution_tags for delete
  using (exists (select 1 from legacy_contributions c where c.id = contribution_id and c.family_id = current_family_id()));
