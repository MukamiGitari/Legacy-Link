import { verifyAccessToken } from '../services/tokens.js';

export async function requireAuth(c, next) {
  const header = c.req.header('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return c.json({ error: 'Missing access token' }, 401);

  try {
    const payload = await verifyAccessToken(c.env, token);
    c.set('userId', payload.sub);
    await next();
  } catch {
    return c.json({ error: 'Invalid or expired access token' }, 401);
  }
}