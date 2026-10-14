-- Adds 'pool' as a valid game_scores.game_key so online pool wins can count toward the
-- family leaderboard. Run this BEFORE deploying the worker change (features.js), otherwise
-- recording a pool score would fail the CHECK constraint. Safe to re-run.

ALTER TABLE game_scores DROP CONSTRAINT IF EXISTS game_scores_game_key_check;
ALTER TABLE game_scores ADD CONSTRAINT game_scores_game_key_check
  CHECK (game_key = ANY (ARRAY['trivia','guessWho','birthdayBingo','whoSaidIt','sudoku','flashcards','scrabbleTiles','pool']));
