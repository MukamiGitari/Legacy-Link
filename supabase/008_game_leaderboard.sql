-- Migration: combined family-games leaderboard (Guess Who, Birthday Bingo,
-- Who Said It, Sudoku, Flashcards). Trivia keeps its own richer trivia_scores
-- table (see 007), but every trivia round also inserts a matching row here so
-- the leaderboard can sum points across ALL games and crown one overall winner.
--
-- Run this in the Supabase SQL Editor against an existing project that was
-- set up from an earlier version of schema.sql. Safe to re-run (idempotent).
-- Fresh projects can just run schema.sql, which already includes this.

create table if not exists game_scores (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  player_name text not null,
  game_key text not null check (game_key in ('trivia', 'guessWho', 'birthdayBingo', 'whoSaidIt', 'sudoku', 'flashcards')),
  points int not null check (points >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_game_scores_family on game_scores(family_id);
create index if not exists idx_game_scores_profile on game_scores(family_id, profile_id);

alter table game_scores enable row level security;

drop policy if exists game_scores_select on game_scores;
drop policy if exists game_scores_insert on game_scores;

-- Anyone in the family (including guests) can see the leaderboard, but a
-- score can only ever be recorded for your own profile — no submitting on
-- someone else's behalf.
create policy game_scores_select on game_scores for select
  using (family_id = current_family_id());
create policy game_scores_insert on game_scores for insert
  with check (family_id = current_family_id() and profile_id = auth.uid());
