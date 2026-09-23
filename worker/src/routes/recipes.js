import { Hono } from 'hono';
import { z } from 'zod';
import { query, withClient } from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const recipes = new Hono();
recipes.use('*', requireAuth);

const recipeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  ingredients: z.array(z.string().max(200)).max(100).default([]),
  instructions: z.string().max(10000).optional(),
});

// GET /api/recipes — list all recipes owned by the caller
recipes.get('/', async (c) => {
  const user = c.get('user');
  const result = await query(
    c.env,
    `SELECT id, title, description, created_at, updated_at
       FROM recipes WHERE owner_id = $1 ORDER BY created_at DESC`,
    [user.id],
  );
  return c.json({ recipes: result.rows });
});

// GET /api/recipes/:id — fetch one recipe with its media items
recipes.get('/:id', async (c) => {
  const user = c.get('user');
  const result = await query(
    c.env,
    `SELECT r.*, COALESCE(json_agg(m.*) FILTER (WHERE m.id IS NOT NULL), '[]') AS images
       FROM recipes r
       LEFT JOIN media_items m ON m.recipe_id = r.id
      WHERE r.id = $1 AND r.owner_id = $2
      GROUP BY r.id`,
    [c.req.param('id'), user.id],
  );
  if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404);
  return c.json({ recipe: result.rows[0] });
});

// POST /api/recipes — create a recipe
recipes.post('/', async (c) => {
  const body = await c.req.json();
  const parsed = recipeSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const { title, description, ingredients, instructions } = parsed.data;
  const user = c.get('user');

  const result = await query(
    c.env,
    `INSERT INTO recipes (owner_id, title, description, ingredients, instructions)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [user.id, title, description ?? null, JSON.stringify(ingredients), instructions ?? null],
  );
  return c.json({ recipe: result.rows[0] }, 201);
});

// PUT /api/recipes/:id — update a recipe (ownership check + update = 2 queries → withClient)
recipes.put('/:id', async (c) => {
  const body = await c.req.json();
  const parsed = recipeSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const user = c.get('user');
  const id = c.req.param('id');

  return withClient(c.env, async (client) => {
    const existing = await client.query(
      `SELECT id FROM recipes WHERE id = $1 AND owner_id = $2`,
      [id, user.id],
    );
    if (existing.rowCount === 0) return c.json({ error: 'Not found' }, 404);

    const fields = parsed.data;
    const result = await client.query(
      `UPDATE recipes SET
         title        = COALESCE($1, title),
         description  = COALESCE($2, description),
         ingredients  = COALESCE($3, ingredients),
         instructions = COALESCE($4, instructions),
         updated_at   = now()
       WHERE id = $5 RETURNING *`,
      [
        fields.title ?? null,
        fields.description ?? null,
        fields.ingredients ? JSON.stringify(fields.ingredients) : null,
        fields.instructions ?? null,
        id,
      ],
    );
    return c.json({ recipe: result.rows[0] });
  });
});

// DELETE /api/recipes/:id
recipes.delete('/:id', async (c) => {
  const user = c.get('user');
  const result = await query(
    c.env,
    `DELETE FROM recipes WHERE id = $1 AND owner_id = $2 RETURNING id`,
    [c.req.param('id'), user.id],
  );
  if (result.rowCount === 0) return c.json({ error: 'Not found' }, 404);
  return c.body(null, 204);
});

export default recipes;
