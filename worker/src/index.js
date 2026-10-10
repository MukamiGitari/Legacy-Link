import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

import authRoutes, { redeemRestorationCode } from './routes/auth.js';
import recipeRoutes from './routes/recipes.js';
import familyRoutes from './routes/family.js';
import albumRoutes from './routes/albums.js';
import featureRoutes from './routes/features.js';
import songRoutes from './routes/songs.js';
import { rateLimit } from './middleware/rateLimit.js';

const app = new Hono();

app.use('*', secureHeaders());
app.use('*', async (c, next) => {
  const allowed = [
    c.env.FRONTEND_ORIGIN,
    'https://legacy-link-web.heritagehub.workers.dev',
    'https://legacy-link-web.pages.dev',
    'https://legacy-link.pages.dev',
    'http://localhost:5173',
    'http://localhost:3000',
  ].filter(Boolean);

  const corsMiddleware = cors({
    origin: (origin) => {
      if (
        !origin ||
        allowed.includes(origin) ||
        origin.endsWith('.pages.dev') ||
        origin.endsWith('.workers.dev')
      ) {
        return origin;
      }
      return c.env.FRONTEND_ORIGIN || origin;
    },
    credentials: true,
  });
  return corsMiddleware(c, next);
});
app.use('/api/recipes/*', rateLimit('API_RATE_LIMITER'));
app.use('/api/family/*', rateLimit('API_RATE_LIMITER'));
app.use('/api/albums/*', rateLimit('API_RATE_LIMITER'));
app.use('/api/features/*', rateLimit('API_RATE_LIMITER'));
app.use('/api/songs/*', rateLimit('API_RATE_LIMITER'));

app.get('/api/health', (c) => c.json({ ok: true }));

app.route('/api/auth', authRoutes);
// Legacy path the current frontend calls. Public (no login needed) and rate-limited like auth. Must be
// registered before the /api/features router, whose routes all require an access token.
app.post('/api/features/restoration/redeem', rateLimit('AUTH_RATE_LIMITER'), redeemRestorationCode);
app.route('/api/recipes', recipeRoutes);
app.route('/api/family', familyRoutes);
app.route('/api/albums', albumRoutes);
app.route('/api/features', featureRoutes);
app.route('/api/songs', songRoutes);

// Centralized error handler.
app.onError((err, c) => {
  console.error('[API Error]:', err);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});

export default app;