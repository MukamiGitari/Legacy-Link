-- Migration: Family Trivia game + leaderboard.
--
-- Run this in the Supabase SQL Editor against an existing project that was
-- set up from an earlier version of schema.sql. Safe to re-run (idempotent).
-- Fresh projects can just run schema.sql, which already includes this.

create table if not exists trivia_scores (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  player_name text not null,
  category text not null check (category in ('our_family', 'history', 'geography')),
  score int not null check (score >= 0),
  total_questions int not null check (total_questions > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_trivia_scores_family on trivia_scores(family_id);
create index if not exists idx_trivia_scores_category on trivia_scores(family_id, category);

alter table trivia_scores enable row level security;

drop policy if exists trivia_scores_select on trivia_scores;
drop policy if exists trivia_scores_insert on trivia_scores;

-- Anyone in the family (including guests) can see the leaderboard, but a
-- score can only ever be recorded for your own profile — no submitting on
-- someone else's behalf.
create policy trivia_scores_select on trivia_scores for select
  using (family_id = current_family_id());
create policy trivia_scores_insert on trivia_scores for insert
  with check (family_id = current_family_id() and profile_id = auth.uid());
