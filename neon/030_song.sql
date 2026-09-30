-- Family Song: shared sections and takes stored in Neon Postgres.
-- Audio clips stored in R2; only the key/URL lives here.

CREATE TABLE IF NOT EXISTS song_sections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  lyrics      TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  created_by  UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS song_takes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id  UUID NOT NULL REFERENCES song_sections(id) ON DELETE CASCADE,
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  audio_url   TEXT NOT NULL,   -- R2 public URL
  photo_url   TEXT,            -- R2 public URL, optional
  recorded_by UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS song_sections_family ON song_sections(family_id, position);
CREATE INDEX IF NOT EXISTS song_takes_section   ON song_takes(section_id, created_at);
