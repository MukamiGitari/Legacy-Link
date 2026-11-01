-- Migration 041: Voice recording attribution for language, memories, and chronicles

-- 1. Language entries (proverbs, sayings, dictionary words, riddles)
ALTER TABLE public.language_entries
  ADD COLUMN IF NOT EXISTS recorded_by_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recorded_by_name TEXT;

-- 2. Memories
ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS recorded_by_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recorded_by_name TEXT;

-- 3. Chronicle Eras
ALTER TABLE public.chronicle_eras
  ADD COLUMN IF NOT EXISTS audio_url TEXT,
  ADD COLUMN IF NOT EXISTS recorded_by_member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recorded_by_name TEXT;
