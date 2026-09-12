-- Migration: adds pets + extra Basic Profile fields to members, and
-- repartitions `biographies` from the old 8-section genealogy template into
-- the 11-section Legacy Link biography template (Basic Profile now lives on
-- `members`; sections 2-11 live on `biographies`).
--
-- Run this in the Supabase SQL Editor against an existing project. Safe to
-- re-run (idempotent). Fresh projects can just run schema.sql, which already
-- includes this shape.

-- Basic Profile additions + pets on members --------------------------------
alter table members add column if not exists professional_title text;
alter table members add column if not exists current_organization text;
alter table members add column if not exists location text;
alter table members add column if not exists contact_links text;
alter table members add column if not exists has_pet boolean not null default false;
alter table members add column if not exists pet_name text;

-- Repartition biographies ----------------------------------------------------
alter table biographies add column if not exists professional_summary text;
alter table biographies add column if not exists early_life_background text;
alter table biographies add column if not exists education text;
alter table biographies add column if not exists career_journey text;
alter table biographies add column if not exists professional_achievements text;
alter table biographies add column if not exists areas_of_expertise text[];
alter table biographies add column if not exists community_contributions text;
alter table biographies add column if not exists personal_philosophy text;
alter table biographies add column if not exists personal_life text;

-- Best-effort carry-over of old free-text sections into the new ones, so
-- existing biographies aren't silently emptied out. Old and new sections
-- don't map 1:1, so this is approximate — families should review and
-- re-edit affected biographies afterward.
update biographies set
  early_life_background = coalesce(early_life_background, nullif(trim(concat_ws(E'\n\n', early_life_family, young_adulthood)), '')),
  career_journey = coalesce(career_journey, work_achievements_passions),
  personal_life = coalesce(personal_life, nullif(trim(concat_ws(E'\n\n', marriage_family_life, later_years, case when stories_memories is not null then coalesce(stories_memories_title, 'Stories We Remember') || E':\n' || stories_memories end)), ''))
where at_a_glance is not null or early_life_family is not null or young_adulthood is not null
   or marriage_family_life is not null or work_achievements_passions is not null
   or stories_memories is not null or later_years is not null;

alter table biographies drop column if exists at_a_glance;
alter table biographies drop column if exists early_life_family;
alter table biographies drop column if exists young_adulthood;
alter table biographies drop column if exists marriage_family_life;
alter table biographies drop column if exists work_achievements_passions;
alter table biographies drop column if exists stories_memories_title;
alter table biographies drop column if exists stories_memories;
alter table biographies drop column if exists later_years;
