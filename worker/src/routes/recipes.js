import { Hono } from 'hono';
import { z } from 'zod';
import { withClient, getOrCreateProfile } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { toPublicUrl } from '../services/r2.js';

const recipes = new Hono();
recipes.use('*', requireAuth);

async function getProfile(client, userId) {
  return await getOrCreateProfile(client, userId);
}

function mapCookbookAlbum(r, env) {
  return {
    id: r.id, familyId: r.family_id, title: r.title, style: r.style,
    description: r.description ?? undefined,
    coverPhotoUrl: toPublicUrl(env, r.cover_photo_url ?? undefined),
    featuredMemberId: r.featured_member_id ?? undefined,
  };
}

function mapRecipe(r, env) {
  const ingredients = Array.isArray(r.ingredients)
    ? r.ingredients
    : (r.ingredients ? JSON.parse(r.ingredients) : []);
  const instructions = Array.isArray(r.instructions)
    ? r.instructions
    : (r.instructions ? JSON.parse(r.instructions) : []);
  return {
    id: r.id, albumId: r.album_id, familyId: r.family_id, title: r.title, category: r.category,
    isVegetarian: r.is_vegetarian ?? false,
    photoUrl: toPublicUrl(env, r.photo_url ?? undefined),
    ingredients,
    instructions,
    cookTime: r.cook_time ?? undefined,
    familyStory: r.family_story ?? undefined,
    contributedByMemberId: r.contributed_by_member_id ?? undefined,
    createdAt: typeof r.created_at === 'string' ? r.created_at : new Date(r.created_at).toISOString(),
  };
}

const cookbookCreateSchema = z.object({
  title: z.string().min(1).max(200),
  style: z.literal('traditional').default('traditional'),
  description: z.string().max(2000).optional(),
  coverPhotoUrl: z.string().optional(),
  featuredMemberId: z.string().uuid().optional(),
});

const recipeCreateSchema = z.object({
  albumId: z.string().uuid(),
  title: z.string().min(1).max(200),
  category: z.enum(['breakfast', 'main', 'snacks', 'desserts']),
  isVegetarian: z.boolean().default(false),
  photoUrl: z.string().optional(),
  ingredients: z.array(z.string().max(300)).default([]),
  instructions: z.array(z.string().max(2000)).default([]),
  cookTime: z.string().max(200).optional(),
  familyStory: z.string().max(5000).optional(),
  contributedByMemberId: z.string().uuid().optional(),
});

// GET /api/recipes — list all recipes for caller's family
recipes.get('/', async (c) => {
  const user = c.get('user');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    const result = await client.query(
      `SELECT * FROM recipes WHERE family_id = $1 ORDER BY created_at DESC`,
      [profile.family_id],
    );
    return c.json({ recipes: result.rows.map(r => mapRecipe(r, c.env)) });
  });
});

// GET /api/recipes/cookbook-albums — list cookbook albums
recipes.get('/cookbook-albums', async (c) => {
  const user = c.get('user');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    const result = await client.query(
      `SELECT * FROM cookbook_albums WHERE family_id = $1 ORDER BY created_at DESC`,
      [profile.family_id],
    );
    return c.json({ cookbookAlbums: result.rows.map(r => mapCookbookAlbum(r, c.env)) });
  });
});

// POST /api/recipes/cookbook-albums — create cookbook album
recipes.post('/cookbook-albums', async (c) => {
  const body = await c.req.json();
  const parsed = cookbookCreateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    const { title, style, description, coverPhotoUrl, featuredMemberId } = parsed.data;

    const result = await client.query(
      `INSERT INTO cookbook_albums (family_id, title, style, description, cover_photo_url, featured_member_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [profile.family_id, title, style, description ?? null, coverPhotoUrl ?? null, featuredMemberId ?? null],
    );
    return c.json({ cookbookAlbum: mapCookbookAlbum(result.rows[0], c.env) }, 201);
  });
});

// PUT /api/recipes/cookbook-albums/:id — update cookbook album
recipes.put('/cookbook-albums/:id', async (c) => {
  const body = await c.req.json();
  const parsed = cookbookCreateSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');
  const id = c.req.param('id');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);

    const { title, style, description, coverPhotoUrl, featuredMemberId } = parsed.data;
    const result = await client.query(
      `UPDATE cookbook_albums SET
         title = COALESCE($1, title),
         style = COALESCE($2, style),
         description = COALESCE($3, description),
         cover_photo_url = COALESCE($4, cover_photo_url),
         featured_member_id = COALESCE($5, featured_member_id)
       WHERE id = $6 AND family_id = $7 RETURNING *`,
      [title ?? null, style ?? null, description ?? null, coverPhotoUrl ?? null, featuredMemberId ?? null, id, profile.family_id],
    );
    if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404);
    return c.json({ cookbookAlbum: mapCookbookAlbum(result.rows[0], c.env) });
  });
});

// DELETE /api/recipes/cookbook-albums/:id — delete cookbook album and its recipes
recipes.delete('/cookbook-albums/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    await client.query(`DELETE FROM recipes WHERE album_id = $1 AND family_id = $2`, [id, profile.family_id]);
    const result = await client.query(`DELETE FROM cookbook_albums WHERE id = $1 AND family_id = $2 RETURNING id`, [id, profile.family_id]);
    if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404);
    return c.body(null, 204);
  });
});

// POST /api/recipes — create a recipe
recipes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = recipeCreateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);

    const {
      albumId, title, category, isVegetarian, photoUrl, ingredients, instructions,
      cookTime, familyStory, contributedByMemberId,
    } = parsed.data;

    const result = await client.query(
      `INSERT INTO recipes (
         album_id, family_id, title, category, is_vegetarian, photo_url,
         ingredients, instructions, cook_time, family_story, contributed_by_member_id
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        albumId, profile.family_id, title, category, isVegetarian, photoUrl ?? null,
        ingredients, instructions, cookTime ?? null, familyStory ?? null, contributedByMemberId ?? null,
      ],
    );
    return c.json({ recipe: mapRecipe(result.rows[0], c.env) }, 201);
  });
});

// PUT /api/recipes/:id — update a recipe
recipes.put('/:id', async (c) => {
  const body = await c.req.json();
  const parsed = recipeCreateSchema.omit({ albumId: true }).partial().safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');
  const id = c.req.param('id');

  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);

    const d = parsed.data;
    const result = await client.query(
      `UPDATE recipes SET
         title = COALESCE($1, title),
         category = COALESCE($2, category),
         is_vegetarian = COALESCE($3, is_vegetarian),
         photo_url = COALESCE($4, photo_url),
         ingredients = COALESCE($5, ingredients),
         instructions = COALESCE($6, instructions),
         cook_time = COALESCE($7, cook_time),
         family_story = COALESCE($8, family_story),
         contributed_by_member_id = COALESCE($9, contributed_by_member_id)
       WHERE id = $10 AND family_id = $11 RETURNING *`,
      [
        d.title ?? null, d.category ?? null, d.isVegetarian ?? null, d.photoUrl ?? null,
        d.ingredients ?? null, d.instructions ?? null, d.cookTime ?? null, d.familyStory ?? null,
        d.contributedByMemberId ?? null, id, profile.family_id,
      ],
    );
    if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404);
    return c.json({ recipe: mapRecipe(result.rows[0], c.env) });
  });
});

// DELETE /api/recipes/:id
recipes.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  return withClient(c.env, async (client) => {
    const profile = await getProfile(client, user.id);
    if (!profile?.family_id) return c.json({ error: 'No family linked' }, 403);
    const result = await client.query(
      `DELETE FROM recipes WHERE id = $1 AND family_id = $2 RETURNING id`,
      [id, profile.family_id],
    );
    if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404);
    return c.body(null, 204);
  });
});

export default recipes;
