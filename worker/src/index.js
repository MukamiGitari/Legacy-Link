import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';

import authRoutes from './routes/auth.js';
import mediaRoutes from './routes/media.js';
import recipeRoutes from './routes/recipes.js';
import familyRoutes from './routes/family.js';
import albumRoutes from './routes/albums.js';
import { rateLimit } from './middleware/rateLimit.js';

const app = new Hono();

app.use('*', secureHeaders());
app.use('*', async (c, next) => {
  const corsMiddleware = cors({ origin: c.env.FRONTEND_ORIGIN, credentials: true });
  return corsMiddleware(c, next);
});
app.use('/api/media/*', rateLimit('API_RATE_LIMITER'));
app.use('/api/recipes/*', rateLimit('API_RATE_LIMITER'));
app.use('/api/family/*', rateLimit('API_RATE_LIMITER'));
app.use('/api/albums/*', rateLimit('API_RATE_LIMITER'));

app.get('/api/health', (c) => c.json({ ok: true }));

app.route('/api/auth', authRoutes);
app.route('/api/media', mediaRoutes);
app.route('/api/recipes', recipeRoutes);
app.route('/api/family', familyRoutes);
app.route('/api/albums', albumRoutes);

// Centralized error handler — never leak stack traces to the client.
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;