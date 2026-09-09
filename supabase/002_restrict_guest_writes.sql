-- Migration: restrict content inserts/updates to non-guest roles.
-- Safe to run directly against your existing Supabase project — it only
-- touches functions and policies, no tables are altered or dropped.
--
-- Run this in the Supabase SQL Editor. It's idempotent: re-running it is safe.

create or replace function current_role_can_add()
returns boolean
language sql stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role != 'guest'
  )
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'members','relationships','albums','photos',
    'memories','events','announcements','chronicle_eras'
  ]
  loop
    execute format($f$ drop policy if exists %I_insert on %I; $f$, t, t);
    execute format($f$ drop policy if exists %I_update on %I; $f$, t, t);

    execute format($f$
      create policy %I_insert on %I for insert
        with check (family_id = current_family_id() and current_role_can_add());
    $f$, t, t);
    execute format($f$
      create policy %I_update on %I for update
        using (family_id = current_family_id() and current_role_can_add());
    $f$, t, t);
  end loop;
end $$;

drop policy if exists photo_tags_insert on photo_tags;
create policy photo_tags_insert on photo_tags for insert
  with check (current_role_can_add() and exists (select 1 from photos p where p.id = photo_id and p.family_id = current_family_id()));
