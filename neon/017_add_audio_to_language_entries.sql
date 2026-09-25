-- Add audio_url column to language_entries and update entry_type constraint to include 'recording'

ALTER TABLE public.language_entries
  ADD COLUMN IF NOT EXISTS audio_url text;

ALTER TABLE public.language_entries
  DROP CONSTRAINT IF EXISTS language_entries_entry_type_check;

ALTER TABLE public.language_entries
  ADD CONSTRAINT language_entries_entry_type_check
  CHECK (entry_type = ANY (ARRAY['word'::text, 'phrase'::text, 'proverb'::text, 'riddle'::text, 'saying'::text, 'recording'::text]));
