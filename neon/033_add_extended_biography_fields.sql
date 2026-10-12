-- ============================================================================
-- Migration 033: Add Extended Biography Fields
-- ============================================================================
-- Adds specialized structured fields to support deep historical, civic,
-- agricultural, and cultural autobiographical records.

ALTER TABLE public.biographies
    ADD COLUMN IF NOT EXISTS public_service_chieftainship TEXT,
    ADD COLUMN IF NOT EXISTS agricultural_pioneering TEXT,
    ADD COLUMN IF NOT EXISTS international_travels TEXT,
    ADD COLUMN IF NOT EXISTS historical_context TEXT,
    ADD COLUMN IF NOT EXISTS cultural_heritage TEXT,
    ADD COLUMN IF NOT EXISTS adversity_and_resilience TEXT;
