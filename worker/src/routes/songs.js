import { Hono } from 'hono';
import { z } from 'zod';
import { withClient, getOrCreateProfile } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { buildKey, getUploadUrl, getPublicUrl } from '../services/r2.js';

const songs = new Hono();
songs.use('*', requireAuth);

// ── helpers ───────────────────────────────────────────────────────────────────

async function familyId(client, userId) {
  const p = await getOrCreateProfile(client, userId);
  if (!p?.family_id) throw new Error('Profile has no family');
  return p.family_id;
}

// ── GET /api/songs  ──  list sections + takes for the caller's family ─────────

songs.get('/', async (c) => {
  const userId = c.get('userId');
  return withClient(c.env, async (client) => {
    const fid = await familyId(client, userId);

    const sections = await client.query(
      `SELECT id, title, lyrics, position, created_at
       FROM song_sections WHERE family_id = $1 ORDER BY position ASC, created_at ASC`,
      [fid]
    );

    const takes = await client.query(
      `SELECT id, section_id, name, audio_url, photo_url, created_at
       FROM song_takes WHERE family_id = $1 ORDER BY created_at ASC`,
      [fid]
    );

    return c.json({ sections: sections.rows, takes: takes.rows });
  });
});

// ── POST /api/songs/sections  ──  add a section ───────────────────────────────

const sectionSchema = z.object({
  title:  z.string().min(1).max(120),
  lyrics: z.string().max(2000).optional(),
});

songs.post('/sections', async (c) => {
  const userId = c.get('userId');
  const body   = await c.req.json();
  const parsed = sectionSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);

  return withClient(c.env, async (client) => {
    const fid = await familyId(client, userId);

    // position = max existing + 1
    const maxRes = await client.query(
      `SELECT COALESCE(MAX(position), -1) AS pos FROM song_sections WHERE family_id = $1`,
      [fid]
    );
    const position = maxRes.rows[0].pos + 1;

    const res = await client.query(
      `INSERT INTO song_sections (family_id, title, lyrics, position, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, title, lyrics, position, created_at`,
      [fid, parsed.data.title, parsed.data.lyrics ?? null, position, userId]
    );
    return c.json(res.rows[0], 201);
  });
});

// ── DELETE /api/songs/sections/:id ───────────────────────────────────────────

songs.delete('/sections/:id', async (c) => {
  const userId = c.get('userId');
  const secId  = c.req.param('id');
  return withClient(c.env, async (client) => {
    const fid = await familyId(client, userId);
    await client.query(
      `DELETE FROM song_sections WHERE id = $1 AND family_id = $2`,
      [secId, fid]
    );
    return c.body(null, 204);
  });
});

// ── POST /api/songs/takes/presign  ──  get upload URL for audio / photo ───────

const presignSchema = z.object({
  filename:    z.string().min(1).max(255),
  contentType: z.string().min(1),
  kind:        z.enum(['audio', 'photo']),
});

songs.post('/takes/presign', async (c) => {
  const body   = await c.req.json();
  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);

  const category = parsed.data.kind === 'audio' ? 'song-audio' : 'song-photos';
  const key      = `${category}/${crypto.randomUUID()}-${parsed.data.filename.replace(/[^a-zA-Z0-9._-]/g,'_').slice(-80)}`;
  const uploadUrl = await getUploadUrl(c.env, key, parsed.data.contentType);
  const publicUrl = getPublicUrl(c.env, key);
  return c.json({ uploadUrl, key, publicUrl });
});

// ── POST /api/songs/takes  ──  save a take (after client uploads audio to R2) ─

const takeSchema = z.object({
  sectionId: z.string().uuid(),
  name:      z.string().min(1).max(100),
  audioUrl:  z.string().url(),
  photoUrl:  z.string().url().optional(),
});

songs.post('/takes', async (c) => {
  const userId = c.get('userId');
  const body   = await c.req.json();
  const parsed = takeSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);

  return withClient(c.env, async (client) => {
    const fid = await familyId(client, userId);

    // Verify section belongs to this family
    const secRes = await client.query(
      `SELECT id FROM song_sections WHERE id = $1 AND family_id = $2`,
      [parsed.data.sectionId, fid]
    );
    if (!secRes.rows[0]) return c.json({ error: 'Section not found' }, 404);

    const res = await client.query(
      `INSERT INTO song_takes (section_id, family_id, name, audio_url, photo_url, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, section_id, name, audio_url, photo_url, created_at`,
      [parsed.data.sectionId, fid, parsed.data.name, parsed.data.audioUrl, parsed.data.photoUrl ?? null, userId]
    );
    return c.json(res.rows[0], 201);
  });
});

// ── DELETE /api/songs/takes/:id ───────────────────────────────────────────────

songs.delete('/takes/:id', async (c) => {
  const userId = c.get('userId');
  const takeId = c.req.param('id');
  return withClient(c.env, async (client) => {
    const fid = await familyId(client, userId);
    await client.query(
      `DELETE FROM song_takes WHERE id = $1 AND family_id = $2`,
      [takeId, fid]
    );
    return c.body(null, 204);
  });
});

export default songs;
