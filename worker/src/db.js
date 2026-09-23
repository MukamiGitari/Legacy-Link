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