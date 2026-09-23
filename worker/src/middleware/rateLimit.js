// Uses Cloudflare's native Rate Limiting binding (configured in
// wrangler.toml) rather than a hand-rolled KV/Durable Object scheme.
// Keyed by client IP so one family member's activity doesn't lock out another.
export function rateLimit(bindingName) {
  return async (c, next) => {
    const limiter = c.env[bindingName];
    const key = c.req.header('CF-Connecting-IP') || 'unknown';
    const { success } = await limiter.limit({ key });
    if (!success) {
      return c.json({ error: 'Too many requests, please slow down' }, 429);
    }
    await next();
  };
}
