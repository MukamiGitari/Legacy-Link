# Deploying Legacy Link (Cloudflare Worker & Neon PostgreSQL)

This guide outlines how to deploy and run Legacy Link on the Cloudflare Worker + Neon PostgreSQL architecture.

---

## 1. Architecture Overview

- **Frontend**: Single-Page React Application with Tailwind CSS & PWA support.
- **Backend API**: Cloudflare Worker running Hono (`worker/src/index.js`).
- **Database**: PostgreSQL on **Neon** (`neon/schema.sql`).
- **Media & Voice Notes**: Object storage in **Cloudflare R2** via S3-compatible presigned URLs.
- **Authentication**: JWT access tokens + HTTP-only secure refresh cookies.

---

## 2. Live Endpoints

- **Live Worker API**: `https://legacy-link-api.heritagehub.workers.dev`
- **Health Check**: `https://legacy-link-api.heritagehub.workers.dev/api/health`

---

## 3. Database Migrations (Neon)

Run the SQL scripts in your Neon SQL Editor:
1. `neon/schema.sql` (Base PostgreSQL schema & tables)
2. `neon/016_remove_holidays_update_categories.sql` (Album & Recipe category constraints)
3. `neon/017_add_audio_to_language_entries.sql` (Heritage Vault Voice Notes & Audio)
4. `neon/users_import.sql` (Optional: Existing user accounts)

---

## 4. Cloudflare Worker Deployment

To update or redeploy the worker:
```bash
cd worker
npx wrangler secret put JWT_ACCESS_SECRET
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler deploy
```

---

## 5. Frontend Build & Hosting (Cloudflare Pages / Vercel)

Set environment variable in your hosting provider:
```env
VITE_API_URL=https://legacy-link-api.heritagehub.workers.dev
```

Build command and output directory:
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
