import { Hono } from 'hono';
import { z } from 'zod';
import { query, withClient, getOrCreateProfile } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { buildKey, getUploadUrl, getPublicUrl, deleteObject, toPublicUrl } from '../services/r2.js';

const albums = new Hono();
albums.use('*', requireAuth);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Load the caller's profile (must have family_id to proceed). */
async function getProfile(client, userId) {
  return await getOrCreateProfile(client, userId);
}

const VALID_CATEGORIES = [
  'childhood', 'birthdays', 'graduations',
  'weddings', 'reunions', 'historical', 'memorials',
];

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const albumCreateSchema = z.object({
  title: z.string().min(1).max(200),
  category: z.enum(VALID_CATEGORIES),
  description: z.string().max(2000).optional(),
  coverPhotoUrl: z.string().url().optional(),
  featuredMemberId: z.string().uuid().optional(),
});

const albumUpdateSchema = albumCreateSchema.partial();

const photoCreateSchema = z.object({
  albumId: z.string().uuid(),
  url: z.string().min(1).max(1000),   // R2 key or presigned URL
  caption: z.string().max(500).optional(),
  takenAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  taggedMemberIds: z.array(z.string().uuid()).max(20).default([]),
});

const presignSchema = z.object({
  albumId: z.string().uuid().optional(),
  filename: z.string().min(1).max(255),
  contentType: z.enum([
    'image/jpeg', 'image/png', 'image/webp', 'image/heic',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/m4a', 'audio/aac', 'audio/mp4'
  ]),
  sizeBytes: z.number().positive().max(50 * 1024 * 1024),
});

// ---------------------------------------------------------------------------
// Albums
// ---------------------------------------------------------------------------

// GET /api/albums — list all albums for the caller's family
albums.get('/', async (c) => {
  const user = c.get('user');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked to your profile' }, 403);

    const result = await client.query(
      `SELECT a.id, a.title, a.category, a.description, a.cover_photo_url,
              a.featured_member_id, a.created_at,
              COUNT(p.id)::int AS photo_count
         FROM albums a
         LEFT JOIN photos p ON p.album_id = a.id
        WHERE a.family_id = $1
        GROUP BY a.id
        ORDER BY a.created_at DESC`,
      [profile.family_id],
    );
    return c.json({ albums: result.rows.map(a => ({ ...a, cover_photo_url: toPublicUrl(c.env, a.cover_photo_url) })) });
  });
});

// GET /api/albums/:id — fetch one album with its photos and tags
albums.get('/:id', async (c) => {
  const user = c.get('user');
  const albumId = c.req.param('id');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked to your profile' }, 403);

    const albumRes = await client.query(
      `SELECT * FROM albums WHERE id = $1 AND family_id = $2`,
      [albumId, profile.family_id],
    );
    if (albumRes.rowCount === 0) return c.json({ error: 'Not found' }, 404);

    const photosRes = await client.query(
      `SELECT p.*, COALESCE(
         json_agg(pt.member_id ORDER BY pt.id) FILTER (WHERE pt.id IS NOT NULL),
         '[]'
       ) AS tagged_member_ids
         FROM photos p
         LEFT JOIN photo_tags pt ON pt.photo_id = p.id
        WHERE p.album_id = $1
        GROUP BY p.id
        ORDER BY p.taken_at ASC NULLS LAST, p.created_at ASC`,
      [albumId],
    );

    const album = { ...albumRes.rows[0], cover_photo_url: toPublicUrl(c.env, albumRes.rows[0].cover_photo_url) };
    const photos = photosRes.rows.map(p => ({ ...p, url: toPublicUrl(c.env, p.url) }));
    return c.json({ album, photos });
  });
});

// POST /api/albums — create a new album
albums.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = albumCreateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked to your profile' }, 403);
    if (!['family_admin', 'family_member'].includes(profile.role)) {
      return c.json({ error: 'Guests cannot create albums' }, 403);
    }

    const { title, category, description, coverPhotoUrl, featuredMemberId } = parsed.data;
    const result = await client.query(
      `INSERT INTO albums (family_id, title, category, description, cover_photo_url, featured_member_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [profile.family_id, title, category, description ?? null, coverPhotoUrl ?? null, featuredMemberId ?? null],
    );
    return c.json({ album: { ...result.rows[0], cover_photo_url: toPublicUrl(c.env, result.rows[0].cover_photo_url) } }, 201);
  });
});

// PUT /api/albums/:id — update album metadata
albums.put('/:id', async (c) => {
  const body = await c.req.json();
  const parsed = albumUpdateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');
  const albumId = c.req.param('id');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked to your profile' }, 403);
    if (!['family_admin', 'family_member'].includes(profile.role)) {
      return c.json({ error: 'Guests cannot edit albums' }, 403);
    }

    const existing = await client.query(
      `SELECT id FROM albums WHERE id = $1 AND family_id = $2`,
      [albumId, profile.family_id],
    );
    if (existing.rowCount === 0) return c.json({ error: 'Not found' }, 404);

    const { title, category, description, coverPhotoUrl, featuredMemberId } = parsed.data;
    const result = await client.query(
      `UPDATE albums SET
         title              = COALESCE($1, title),
         category           = COALESCE($2, category),
         description        = COALESCE($3, description),
         cover_photo_url    = COALESCE($4, cover_photo_url),
         featured_member_id = COALESCE($5, featured_member_id)
       WHERE id = $6
       RETURNING *`,
      [title ?? null, category ?? null, description ?? null, coverPhotoUrl ?? null, featuredMemberId ?? null, albumId],
    );
    return c.json({ album: { ...result.rows[0], cover_photo_url: toPublicUrl(c.env, result.rows[0].cover_photo_url) } });
  });
});

// DELETE /api/albums/:id — delete album and all its photos (admin only)
albums.delete('/:id', async (c) => {
  const user = c.get('user');
  const albumId = c.req.param('id');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked to your profile' }, 403);
    if (profile.role !== 'family_admin') return c.json({ error: 'Only admins can delete albums' }, 403);

    const existing = await client.query(
      `SELECT id FROM albums WHERE id = $1 AND family_id = $2`,
      [albumId, profile.family_id],
    );
    if (existing.rowCount === 0) return c.json({ error: 'Not found' }, 404);

    // Delete tags → photos → album (FK cascade order)
    await client.query(
      `DELETE FROM photo_tags WHERE photo_id IN (SELECT id FROM photos WHERE album_id = $1)`,
      [albumId],
    );
    await client.query(`DELETE FROM photos WHERE album_id = $1`, [albumId]);
    await client.query(`DELETE FROM albums WHERE id = $1`, [albumId]);

    return c.body(null, 204);
  });
});

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

// POST /api/albums/photos/presign-upload — get a presigned R2 upload URL
// Verifies the caller owns (is in the family of) the target album first.
albums.post('/photos/presign-upload', async (c) => {
  const body = await c.req.json();
  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const { albumId, filename, contentType, sizeBytes } = parsed.data;
  const user = c.get('user');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked to your profile' }, 403);
    if (!['family_admin', 'family_member'].includes(profile.role)) {
      return c.json({ error: 'Guests cannot upload photos' }, 403);
    }

    if (albumId) {
      const albumRes = await client.query(
        `SELECT id FROM albums WHERE id = $1 AND family_id = $2`,
        [albumId, profile.family_id],
      );
      if (albumRes.rowCount === 0) return c.json({ error: 'Album not found' }, 404);
    }

    const key = buildKey('photos', filename);
    const uploadUrl = await getUploadUrl(c.env, key, contentType);
    const publicUrl = getPublicUrl(c.env, key);
    return c.json({ uploadUrl, key, publicUrl });
  });
});

// POST /api/albums/photos — register an uploaded photo and tag members
albums.post('/photos', async (c) => {
  const body = await c.req.json();
  const parsed = photoCreateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const { albumId, url, caption, takenAt, taggedMemberIds } = parsed.data;
  const user = c.get('user');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked to your profile' }, 403);
    if (!['family_admin', 'family_member'].includes(profile.role)) {
      return c.json({ error: 'Guests cannot add photos' }, 403);
    }

    // Confirm album belongs to this family
    const albumRes = await client.query(
      `SELECT id FROM albums WHERE id = $1 AND family_id = $2`,
      [albumId, profile.family_id],
    );
    if (albumRes.rowCount === 0) return c.json({ error: 'Album not found' }, 404);

    // Insert photo
    const photoRes = await client.query(
      `INSERT INTO photos (album_id, family_id, url, caption, taken_at, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [albumId, profile.family_id, url, caption ?? null, takenAt ?? null, user.id],
    );
    const photo = photoRes.rows[0];

    // Insert member tags (if any)
    if (taggedMemberIds.length > 0) {
      const tagValues = taggedMemberIds
        .map((_, i) => `($1, $${i + 2})`)
        .join(', ');
      await client.query(
        `INSERT INTO photo_tags (photo_id, member_id) VALUES ${tagValues}`,
        [photo.id, ...taggedMemberIds],
      );
    }

    return c.json({ photo: { ...photo, url: toPublicUrl(c.env, photo.url), tagged_member_ids: taggedMemberIds } }, 201);
  });
});

// DELETE /api/albums/photos/:id — delete a photo, its tags, and the R2 object
albums.delete('/photos/:id', async (c) => {
  const user = c.get('user');
  const photoId = c.req.param('id');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked to your profile' }, 403);
    if (!['family_admin', 'family_member'].includes(profile.role)) {
      return c.json({ error: 'Guests cannot delete photos' }, 403);
    }

    // Confirm photo belongs to this family
    const photoRes = await client.query(
      `SELECT p.url FROM photos p
        JOIN albums a ON a.id = p.album_id
       WHERE p.id = $1 AND a.family_id = $2`,
      [photoId, profile.family_id],
    );
    if (photoRes.rowCount === 0) return c.json({ error: 'Not found' }, 404);

    const r2Key = photoRes.rows[0].url; // stored as the R2 key

    await client.query(`DELETE FROM photo_tags WHERE photo_id = $1`, [photoId]);
    await client.query(`DELETE FROM photos WHERE id = $1`, [photoId]);

    // Best-effort R2 cleanup (don't fail the request if this errors)
    try { await deleteObject(c.env, r2Key); } catch (_) {}

    return c.body(null, 204);
  });
});

// PATCH /api/albums/photos/:id/tags — replace the member-tag list for a photo
albums.patch('/photos/:id/tags', async (c) => {
  const body = await c.req.json();
  const parsed = z.object({ memberIds: z.array(z.string().uuid()).max(20) }).safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const { memberIds } = parsed.data;
  const user = c.get('user');
  const photoId = c.req.param('id');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked to your profile' }, 403);

    const photoRes = await client.query(
      `SELECT p.id FROM photos p
        JOIN albums a ON a.id = p.album_id
       WHERE p.id = $1 AND a.family_id = $2`,
      [photoId, profile.family_id],
    );
    if (photoRes.rowCount === 0) return c.json({ error: 'Not found' }, 404);

    // Replace all tags atomically
    await client.query(`DELETE FROM photo_tags WHERE photo_id = $1`, [photoId]);
    if (memberIds.length > 0) {
      const tagValues = memberIds.map((_, i) => `($1, $${i + 2})`).join(', ');
      await client.query(
        `INSERT INTO photo_tags (photo_id, member_id) VALUES ${tagValues}`,
        [photoId, ...memberIds],
      );
    }

    return c.json({ photoId, taggedMemberIds: memberIds });
  });
});

export default albums;
