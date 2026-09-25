import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { withClient } from '../db.js';
import { signAccessToken, generateRefreshToken, hashToken, verifyAccessToken } from '../services/tokens.js';
import { rateLimit } from '../middleware/rateLimit.js';

const auth = new Hono();
auth.use('*', rateLimit('AUTH_RATE_LIMITER'));

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1).max(100),
  inviteCode: z.string().optional(),
  familyInviteCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

auth.post('/register', async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);
  const { email, password, name, inviteCode, familyInviteCode } = parsed.data;

  const passwordHash = await bcrypt.hash(password, 12);
  const codeToUse = (familyInviteCode || inviteCode || '').trim();

  try {
    return await withClient(c.env, async (client) => {
      let familyInvite = null;
      if (codeToUse) {
        const inviteResult = await client.query(
          `SELECT id, family_id, role, member_id FROM invitation_codes
           WHERE code = $1 AND redeemed_by IS NULL
             AND (expires_at IS NULL OR expires_at > now())`,
          [codeToUse.toUpperCase()]
        );
        familyInvite = inviteResult.rows[0];
        if (!familyInvite) {
          return c.json({ error: 'That family invitation code is invalid or already used.' }, 400);
        }
      }

      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3)
         RETURNING id, email, name, role`,
        [email.toLowerCase(), passwordHash, name]
      );
      const user = userResult.rows[0];

      let familyId, profileRole;
      if (familyInvite) {
        familyId = familyInvite.family_id;
        profileRole = familyInvite.role;
        await client.query(
          `INSERT INTO profiles (id, family_id, member_id, display_name, email, role)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [user.id, familyId, familyInvite.member_id, name, email.toLowerCase(), profileRole]
        );
        await client.query(
          `UPDATE invitation_codes SET redeemed_by = $1, redeemed_at = now() WHERE id = $2`,
          [user.id, familyInvite.id]
        );
      } else {
        profileRole = 'family_admin';
        const familyResult = await client.query(
          `INSERT INTO families (name) VALUES ($1) RETURNING id`,
          [`${name}'s Family`]
        );
        familyId = familyResult.rows[0].id;
        await client.query(
          `INSERT INTO profiles (id, family_id, display_name, email, role)
           VALUES ($1, $2, $3, $4, $5)`,
          [user.id, familyId, name, email.toLowerCase(), profileRole]
        );
      }

      const accessToken = await issueSessionWithClient(c, client, user);
      return c.json({
        user,
        profile: { id: user.id, familyId, role: profileRole },
        accessToken,
      }, 201);
    });
  } catch (err) {
    if (err.code === '23505') return c.json({ error: 'An account with that email already exists' }, 409);
    console.error(err);
    return c.json({ error: 'Could not create account' }, 500);
  }
});

auth.post('/login', async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Invalid email or password' }, 400);
  const { email, password } = parsed.data;

  return withClient(c.env, async (client) => {
    const result = await client.query(
      `SELECT id, email, name, role, password_hash FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );
    const user = result.rows[0];

    const hashToCheck = user?.password_hash || '$2a$12$invalidsaltinvalidsaltinvalidsaltinvalidsalt';
    const valid = await bcrypt.compare(password, hashToCheck);

    if (!user || !valid) return c.json({ error: 'Invalid email or password' }, 401);

    const accessToken = await issueSessionWithClient(c, client, user);
    return c.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken });
  });
});

auth.post('/refresh', async (c) => {
  const token = getCookie(c, 'refresh_token');
  if (!token) return c.json({ error: 'No refresh token' }, 401);

  return withClient(c.env, async (client) => {
    const tokenHash = await hashToken(token);
    const result = await client.query(
      `SELECT rt.user_id, u.role, rt.expires_at, rt.revoked_at
       FROM refresh_tokens rt JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1`,
      [tokenHash]
    );
    const row = result.rows[0];

    if (!row || row.revoked_at || new Date(row.expires_at) < new Date()) {
      return c.json({ error: 'Refresh token invalid or expired' }, 401);
    }

    await client.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1`, [tokenHash]);

    const accessToken = await signAccessToken(c.env, { id: row.user_id, role: row.role });
    const { token: newRefresh, tokenHash: newHash, expiresAt } = await generateRefreshToken();
    await client.query(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`, [
      row.user_id, newHash, expiresAt,
    ]);
    setRefreshCookie(c, newRefresh, expiresAt);

    return c.json({ accessToken });
  });
});

auth.post('/logout', async (c) => {
  const token = getCookie(c, 'refresh_token');
  if (token) {
    await withClient(c.env, async (client) => {
      await client.query(`UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1`, [await hashToken(token)]);
    });
  }
  deleteCookie(c, 'refresh_token', { path: '/api/auth' });
  return c.body(null, 204);
});

auth.get('/me', async (c) => {
  const header = c.req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return c.json({ error: 'Missing access token' }, 401);

  try {
    const payload = await verifyAccessToken(c.env, token);
    return await withClient(c.env, async (client) => {
      const userResult = await client.query(`SELECT id, email, name, role FROM users WHERE id = $1`, [payload.sub]);
      if (userResult.rowCount === 0) return c.json({ error: 'User not found' }, 401);

      const profileResult = await client.query(
        `SELECT id, family_id, member_id, display_name, email, avatar_url, role FROM profiles WHERE id = $1`,
        [payload.sub]
      );
      const profile = profileResult.rows[0] || null;

      return c.json({ user: userResult.rows[0], profile });
    });
  } catch {
    return c.json({ error: 'Invalid or expired access token' }, 401);
  }
});

async function issueSessionWithClient(c, client, user) {
  const accessToken = await signAccessToken(c.env, user);
  const { token, tokenHash, expiresAt } = await generateRefreshToken();
  await client.query(`INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`, [
    user.id, tokenHash, expiresAt,
  ]);
  setRefreshCookie(c, token, expiresAt);
  return accessToken;
}

function setRefreshCookie(c, token, expiresAt) {
  setCookie(c, 'refresh_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/api/auth',
    expires: expiresAt,
  });
}

export default auth;
