-- Migration: add 'scrabbleTiles' as a valid game_key so the new Scrabble
-- Tiles game can post to the combined family leaderboard.
--
-- Run this in the Supabase SQL Editor against an existing project that was
-- set up before this game was added. Safe to re-run. Fresh projects can just
-- run schema.sql, which already includes this game key.

alter table game_scores drop constraint if exists game_scores_game_key_check;

alter table game_scores add constraint game_scores_game_key_check
  check (game_key in ('trivia', 'guessWho', 'birthdayBingo', 'whoSaidIt', 'sudoku', 'flashcards', 'scrabbleTiles'));
