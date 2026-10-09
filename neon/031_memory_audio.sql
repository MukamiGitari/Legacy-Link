-- Add an optional spoken/recorded audio clip to family memories

ALTER TABLE public.memories
  ADD COLUMN IF NOT EXISTS audio_url text;
