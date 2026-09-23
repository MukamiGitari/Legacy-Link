import { Hono } from 'hono';
import { z } from 'zod';
import { query, withClient } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { buildKey, getUploadUrl, getDownloadUrl, deleteObject } from '../services/r2.js';

const media = new Hono();
media.use('*', requireAuth);

const CATEGORIES = ['photos', 'documents', 'videos', 'recipe-images'];

const ALLOWED_MIME = {
  photos: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  'recipe-images': ['image/jpeg', 'image/png', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ],
  videos: ['video/mp4', 'video/quicktime', 'video/webm'],
};

const MAX_SIZE_BYTES = {
  photos: 25 * 1024 * 1024,
  'recipe-images': 25 * 1024 * 1024,
  documents: 50 * 1024 * 1024,
  videos: 2 * 1024 * 1024 * 1024,
};

const presignSchema = z.object({
  category: z.enum(CATEGORIES),
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1),
  sizeBytes: z.number().positive(),
  recipeId: z.string().uuid().optional(),
});

// POST /api/media/presign-upload
// For recipe-image uploads: verify ownership first, then generate the presigned URL.
// Two DB queries when recipeId is present → withClient; zero queries otherwise → plain R2.
media.post('/presign-upload', async (c) => {
  const body = await c.req.json();
  const parsed = presignSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const { category, filename, contentType, sizeBytes, recipeId } = parsed.data;
  const user = c.get('user');

  if (!ALLOWED_MIME[category].includes(contentType)) {
    return c.json({ error: `${contentType} is not allowed for ${category}` }, 415);
  }
  if (sizeBytes > MAX_SIZE_BYTES[category]) {
    return c.json({ error: 'File too large for this category' }, 413);
  }

  // Ownership check for recipe-images (one DB query — safe with query())
  if (category === 'recipe-images' && recipeId) {
    const owns = await query(
      c.env,
      `SELECT 1 FROM recipes WHERE id = $1 AND owner_id = $2`,
      [recipeId, user.id],
    );
    if (owns.rowCount === 0) return c.json({ error: 'Not your recipe' }, 403);
  }

  const key = buildKey(category, filename);
  const uploadUrl = await getUploadUrl(c.env, key, contentType);
  return c.json({ uploadUrl, key });
});

const registerSchema = z.object({
  category: z.enum(CATEGORIES),
  key: z.string().min(1),
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().positive(),
  recipeId: z.string().uuid().optional(),
});

// POST /api/media — register an already-uploaded R2 object in the DB
media.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const { category, key, filename, mimeType, sizeBytes, recipeId } = parsed.data;
  const user = c.get('user');

  if (!key.startsWith(`${category}/`)) return c.json({ error: 'Key does not match category' }, 400);

  const result = await query(
    c.env,
    `INSERT INTO media_items (owner_id, category, r2_key, filename, mime_type, size_bytes, recipe_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, category, filename, mime_type, size_bytes, created_at`,
    [user.id, category, key, filename, mimeType, sizeBytes, recipeId ?? null],
  );
  return c.json({ media: result.rows[0] }, 201);
});

// GET /api/media — list media items (optionally filtered by category)
media.get('/', async (c) => {
  const category = c.req.query('category');
  if (category && !CATEGORIES.includes(category)) return c.json({ error: 'Invalid category' }, 400);
  const user = c.get('user');

  const result = await query(
    c.env,
    category
      ? `SELECT id, category, filename, mime_type, size_bytes, created_at
           FROM media_items WHERE owner_id = $1 AND category = $2 ORDER BY created_at DESC`
      : `SELECT id, category, filename, mime_type, size_bytes, created_at
           FROM media_items WHERE owner_id = $1 ORDER BY created_at DESC`,
    category ? [user.id, category] : [user.id],
  );
  return c.json({ items: result.rows });
});

// GET /api/media/:id/download-url
media.get('/:id/download-url', async (c) => {
  const user = c.get('user');
  const result = await query(
    c.env,
    `SELECT r2_key FROM media_items WHERE id = $1 AND owner_id = $2`,
    [c.req.param('id'), user.id],
  );
  if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404);

  const downloadUrl = await getDownloadUrl(c.env, result.rows[0].r2_key);
  return c.json({ downloadUrl });
});

// DELETE /api/media/:id — delete DB row then R2 object
// withClient: SELECT r2_key then DELETE in the same connection (2 queries).
media.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  return withClient(c.env, async (client) => {
    const result = await client.query(
      `DELETE FROM media_items WHERE id = $1 AND owner_id = $2 RETURNING r2_key`,
      [id, user.id],
    );
    if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404);

    await deleteObject(c.env, result.rows[0].r2_key);
    return c.body(null, 204);
  });
});

export default media;
