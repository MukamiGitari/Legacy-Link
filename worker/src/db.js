import pg from 'pg';

const { Pool } = pg;

/**
 * Create a short-lived Pool for one request.
 * Hyperdrive does the real connection pooling at the edge — Workers should
 * never hold a long-lived singleton pool across requests.
 */
function makePool(env) {
  const pool = new Pool({ connectionString: env.HYPERDRIVE.connectionString, max: 5 });
  pool.on('error', (err) => console.error('[pg pool] background error:', err));
  return pool;
}

/**
 * Run a single parameterised query and return its result.
 * The pool is fully closed after the query completes (or throws), so there is
 * no connection leak even if the caller never calls pool.end() itself.
 *
 * Use this for every route that runs exactly ONE query.
 *
 * @param {object}  env    - Hono context env (must have HYPERDRIVE)
 * @param {string}  sql    - Parameterised SQL string
 * @param {Array}   params - Bound parameter values
 * @returns {Promise<import('pg').QueryResult>}
 */
export async function query(env, sql, params = []) {
  const pool = makePool(env);
  try {
    return await pool.query(sql, params);
  } finally {
    await pool.end();
  }
}

/**
 * Check out a single client for the lifetime of a handler and release it
 * when done — guaranteeing that every query in the handler runs on the SAME
 * underlying connection (required for multi-statement routes).
 *
 * Use this for every route that runs MORE THAN ONE query (e.g. a SELECT to
 * verify ownership followed by an UPDATE).
 *
 * @param {object}   env - Hono context env (must have HYPERDRIVE)
 * @param {Function} fn  - Async function receiving a `pg.PoolClient`
 * @returns {Promise<any>} Whatever `fn` returns
 */
export async function withClient(env, fn) {
  const pool = makePool(env);
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * Resolves a profile for a given user ID. If the profile was created with a different ID
 * (e.g. from Supabase import by email) or if no profile exists, it matches by email or auto-links
 * to the family so users are never left with an unlinked profile.
 */
export async function getOrCreateProfile(client, userId) {
  if (!userId) return null;

  try {
    // 1. Try finding by ID
    let res = await client.query(
      `SELECT id, family_id, member_id, display_name, email, avatar_url, role FROM profiles WHERE id = $1`,
      [userId]
    );
    if (res.rows[0]) return res.rows[0];

    // 2. Lookup the user's email
    const userRes = await client.query(`SELECT id, email, name, role FROM users WHERE id = $1`, [userId]);
    const user = userRes.rows[0];
    if (!user) return null;

    // 3. Try finding by email (case-insensitive)
    res = await client.query(
      `SELECT id, family_id, member_id, display_name, email, avatar_url, role FROM profiles WHERE lower(email) = lower($1)`,
      [user.email]
    );
    if (res.rows[0]) {
      return res.rows[0];
    }

    // 4. If no profile exists, find existing family or create default
    const anyFamily = await client.query(`SELECT id FROM families ORDER BY created_at ASC LIMIT 1`);
    let familyId = anyFamily.rows[0]?.id;
    if (!familyId) {
      const newFam = await client.query(`INSERT INTO families (name) VALUES ($1) RETURNING id`, [`M'Ikunyua Family`]);
      familyId = newFam.rows[0].id;
    }

    // 5. Create profile for the user linked to the family
    const newProfileRes = await client.query(
      `INSERT INTO profiles (id, family_id, display_name, email, role)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET family_id = EXCLUDED.family_id
       RETURNING id, family_id, member_id, display_name, email, avatar_url, role`,
      [userId, familyId, user.name || 'Family Member', user.email, user.role || 'family_admin']
    );
    return newProfileRes.rows[0];
  } catch (err) {
    console.error('[getOrCreateProfile error]:', err);
    return null;
  }
}