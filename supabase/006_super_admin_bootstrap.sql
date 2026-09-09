-- Migration 006: super_admin bootstrap + RLS helper hardening
--
-- Problem: current_family_id() and current_role_is_admin() are defined as
-- SECURITY INVOKER (the default). This means they execute under the calling
-- user's RLS context. When a super_admin user runs a query, those helpers
-- try to SELECT from `profiles` — but `profiles` itself has RLS enabled and
-- needs the helpers to resolve it, creating a circular dependency that
-- silently returns NULL / FALSE. The fix is SECURITY DEFINER, which lets the
-- helpers run as the function owner (postgres/supabase_admin) and bypass RLS.
--
-- This migration is safe to re-run on an existing project; all statements are
-- idempotent. Fresh projects should run schema.sql first (which will also need
-- this patch applied, or a future version of schema.sql can include it).

-- ----------------------------------------------------------------------------
-- 1. Harden helper functions with SECURITY DEFINER
-- ----------------------------------------------------------------------------

create or replace function current_family_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select family_id from public.profiles where id = auth.uid()
$$;

create or replace function current_role_is_admin()
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('super_admin', 'family_admin')
  )
$$;

create or replace function current_role_can_add()
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role != 'guest'
  )
$$;

-- ----------------------------------------------------------------------------
-- 2. INSERT policies on families and profiles for user registration
-- ----------------------------------------------------------------------------

-- Allow any authenticated user to create a new family during registration
drop policy if exists families_insert on families;
create policy families_insert on families for insert
  with check (auth.role() = 'authenticated');

-- Allow a user to insert their own profile row (id = auth.uid()).
drop policy if exists profiles_insert_self on profiles;
create policy profiles_insert_self on profiles for insert
  with check (id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. create_super_admin() — SECURITY DEFINER stored procedure
--    Called by the super-admin-bootstrap Edge Function (service role).
--    Creates or upgrades a profiles row to super_admin.
--    The function is owned by postgres and bypasses all RLS.
-- ----------------------------------------------------------------------------

create or replace function create_super_admin(
  p_user_id   uuid,
  p_family_id uuid,
  p_display_name text,
  p_email     text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
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

-- Restrict execution to the service role only.
revoke execute on function create_super_admin(uuid, uuid, text, text) from public;
