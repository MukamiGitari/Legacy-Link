import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { withClient, getOrCreateProfile } from '../db.js';
import { signAccessToken, generateRefreshToken, hashToken, verifyAccessToken } from '../services/tokens.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { verifyGoogleIdToken } from '../services/google.js';

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
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
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
    const inputVal = email.trim().toLowerCase();
    const result = await client.query(
      `SELECT u.id, u.email, u.name, u.role, u.password_hash 
       FROM users u
       LEFT JOIN profiles p ON p.id = u.id
       WHERE LOWER(u.email) = $1 OR LOWER(u.name) = $1 OR LOWER(p.display_name) = $1
       LIMIT 1`,
      [inputVal]
    );
    const user = result.rows[0];

    const hashToCheck = user?.password_hash || '$2a$12$invalidsaltinvalidsaltinvalidsaltinvalidsalt';
    const valid = await bcrypt.compare(password, hashToCheck);

    if (!user || !valid) return c.json({ error: 'Invalid email or password' }, 401);

    const profile = await getOrCreateProfile(client, user.id);
    const accessToken = await issueSessionWithClient(c, client, user);
    return c.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, profile, accessToken });
  });
});

// Public client config the login screen needs (the Google client ID is public by design).
auth.get('/config', (c) => c.json({ googleClientId: c.env.GOOGLE_CLIENT_ID || null }));

const googleSchema = z.object({
  credential: z.string().min(20),
  mode: z.enum(['signin', 'join', 'register']).default('signin'),
  inviteCode: z.string().optional(),
});

/**
 * Sign in / join / register with a Google ID token.
 *  - An existing account (matched by Google id, else by the verified Google email) just signs in.
 *  - signin  + no account  -> refused (nobody is added to a family by accident)
 *  - join    + no account  -> needs a valid family invitation code, like email sign-up
 *  - register + no account -> creates a new family with the person as its admin, like email sign-up
 */
auth.post('/google', async (c) => {
  const parsed = googleSchema.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: 'Google sign-in failed. Please try again.' }, 400);
  const { credential, mode, inviteCode } = parsed.data;

  let g;
  try {
    g = await verifyGoogleIdToken(c.env, credential);
  } catch (err) {
    return c.json({ error: err.message || 'Google sign-in failed.' }, 401);
  }

  try {
    return await withClient(c.env, async (client) => {
      const found = await client.query(
        `SELECT id, email, name, role, google_sub FROM users
         WHERE google_sub = $1 OR LOWER(email) = $2
         ORDER BY (google_sub = $1) DESC NULLS LAST LIMIT 1`,
        [g.sub, g.email]
      );
      let user = found.rows[0];

      if (user) {
        if (!user.google_sub) {
          await client.query(`UPDATE users SET google_sub = $1 WHERE id = $2`, [g.sub, user.id]);
        }
        const profile = await getOrCreateProfile(client, user.id);
        const accessToken = await issueSessionWithClient(c, client, user);
        return c.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, profile, accessToken });
      }

      if (mode === 'signin') {
        return c.json({
          error: `No account uses ${g.email}. Choose "Join" with an invitation code, or "Register" to start a new family.`,
        }, 404);
      }

      let familyInvite = null;
      if (mode === 'join') {
        const code = (inviteCode || '').trim();
        if (!code) return c.json({ error: 'Enter your family invitation code first, then continue with Google.' }, 400);
        const inviteResult = await client.query(
          `SELECT id, family_id, role, member_id FROM invitation_codes
           WHERE code = $1 AND redeemed_by IS NULL
             AND (expires_at IS NULL OR expires_at > now())`,
          [code.toUpperCase()]
        );
        familyInvite = inviteResult.rows[0];
        if (!familyInvite) return c.json({ error: 'That family invitation code is invalid or already used.' }, 400);
      }

      const created = await client.query(
        `INSERT INTO users (email, password_hash, name, google_sub) VALUES ($1, NULL, $2, $3)
         RETURNING id, email, name, role`,
        [g.email, g.name, g.sub]
      );
      user = created.rows[0];

      let familyId, profileRole;
      if (familyInvite) {
        familyId = familyInvite.family_id;
        profileRole = familyInvite.role;
        await client.query(
          `INSERT INTO profiles (id, family_id, member_id, display_name, email, avatar_url, role)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [user.id, familyId, familyInvite.member_id, g.name, g.email, g.picture ?? null, profileRole]
        );
        await client.query(
          `UPDATE invitation_codes SET redeemed_by = $1, redeemed_at = now() WHERE id = $2`,
          [user.id, familyInvite.id]
        );
      } else {
        profileRole = 'family_admin';
        const familyResult = await client.query(`INSERT INTO families (name) VALUES ($1) RETURNING id`, [`${g.name}'s Family`]);
        familyId = familyResult.rows[0].id;
        await client.query(
          `INSERT INTO profiles (id, family_id, display_name, email, avatar_url, role)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [user.id, familyId, g.name, g.email, g.picture ?? null, profileRole]
        );
      }

      const accessToken = await issueSessionWithClient(c, client, user);
      return c.json({ user, profile: { id: user.id, familyId, role: profileRole }, accessToken }, 201);
    });
  } catch (err) {
    if (err.code === '42703') {
      console.error('Google sign-in needs neon/033_google_auth.sql to be run', err);
      return c.json({ error: 'Google sign-in is not finished being set up on the server (database update pending).' }, 500);
    }
    if (err.code === '23505') return c.json({ error: 'An account with that email already exists. Please try again.' }, 409);
    console.error(err);
    return c.json({ error: 'Could not sign in with Google' }, 500);
  }
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

      const profile = await getOrCreateProfile(client, payload.sub);

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

/**
 * Redeem a one-time restoration code to set a new password. Public on purpose: the person is
 * locked out, so there is no access token. It sits behind AUTH_RATE_LIMITER (see below) and
 * only works for a code issued for that exact email's profile that hasn't been used.
 */
export async function redeemRestorationCode(c) {
  const body = await c.req.json().catch(() => ({}));
  const parsed = z.object({
    email: z.string().email(),
    code: z.string().min(1),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  }).safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0].message }, 400);

  const { email, code, newPassword } = parsed.data;

  return withClient(c.env, async (client) => {
    const profRes = await client.query(`SELECT id, family_id FROM profiles WHERE LOWER(email) = LOWER($1)`, [email.toLowerCase().trim()]);
    if (profRes.rowCount === 0) return c.json({ error: "That email doesn't match an account" }, 404);
    const targetProfile = profRes.rows[0];

    const codeRes = await client.query(
      `SELECT id FROM restoration_codes WHERE profile_id = $1 AND UPPER(code) = UPPER($2) AND redeemed_at IS NULL`,
      [targetProfile.id, code.toUpperCase().trim()]
    );
    if (codeRes.rowCount === 0) {
      return c.json({ error: 'That restoration code is invalid, expired, or already used.' }, 400);
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await client.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, targetProfile.id]);
    await client.query(`UPDATE restoration_codes SET redeemed_at = now() WHERE id = $1`, [codeRes.rows[0].id]);

    return c.json({ ok: true });
  });
}

auth.post('/restoration/redeem', redeemRestorationCode);

export default auth;
