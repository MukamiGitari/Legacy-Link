# Legacy Link (🌿)
> *"Our Roots, Our Story, Our Legacy."*

A production-ready, interactive digital family heritage archive, genealogy platform, and multi-template family tree system.

---

## ✨ Key Features & Capabilities

### 1. 🌳 6 Interactive Family Tree Visualizer Engines
All six templates run against the exact same underlying family relational database without losing node data or relationships:
1. **Classic Tree**: Traditional illustrated grand oak tree background with roots, branches, leaf canopy, and golden circular member badges.
2. **Modern Timeline**: Vertical generation swimlanes (Generation 1 → Generation 2 → Generation 3 → Generation 4) with chronological milestone markers.
3. **Photo Family Tree**: Gallery-style visual layout highlighting high-resolution portrait avatars and golden connection lines.
4. **Circular / Radial Tree**: Concentric orbital ancestry radiating from the root ancestors in the center out to great-grandchildren.
5. **Minimalist Tree**: Architectural, clean, high-contrast box cards with optimal readability and thin line connectors.
6. **Heritage Style**: Archival vintage parchment aesthetic with sepia portrait filters, ornate corner flourishes, and antique scroll banners.

### 2. 🗄️ Relational Lineage & Member Management
- Relational mapping (Parent, Child, Spouse, Sibling, Adoptive, Step) — no static hardcoding.
- Interactive **Person Detail Drawer**: slides out upon clicking any person in the tree, showing immediate lineage (Parents, Spouse, Children) with one-click centering and branch focus.
- **Member Directory**: Grid & List table views with multi-criteria filtering (All, Living, Deceased, Generations 1–4, Gender) and pagination.
- **Member Profile**: 6-tab comprehensive dossier (*About, Family, Tagged Photos, Memories, Events, Timeline*).
- **Add / Edit Member Modal**: Rich biographical form with avatar preset picker, date of birth/passing, resting place, occupation, and relationship linker.

### 3. 📸 Family Media & Storytelling Archive
- **Family Photo Gallery**: Album categorization (*Weddings, Reunions, Childhood, Historical, Memorials, Holidays*) with full-screen lightbox viewer and member face-tag navigation.
- **Family Memories**: Storytelling format with photos and author attribution (e.g., *"Grandmother's Wedding Day & The Silk Shawl (1960)"*).
- **Events Calendar**: Milestone scheduler with RSVP attendance tracking (*Reunions, Birthdays, Memorials, Meetings*).
- **Announcements**: Broadcast noticeboard with priority badges (*Urgent, Important, Normal*).
- **Family History Chronicle**: Multi-era chronological timeline tracing ancestry from 1890s origins to modern global horizons.

### 4. 🛡️ Admin Suite & Guided Onboarding Wizard
- **Tree Templates Switcher**: 2×3 visual grid with preview and safety confirmation modals.
- **User Management**: Role-based access control (*Super Admin, Family Admin, Family Member, Guest*) and invitation code generator.
- **8-Step Guided Onboarding Wizard**: Guides administrators through setting up new families from scratch.
- **System Activity Audit Log**: Tracks real-time changes to records and media.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ & npm

### Installation
```bash
cd legacy-link-heritage-hub
npm install
npm run dev
```

### Building for Production
```bash
npm run build
```

---

## 🗃️ Supabase Database Schema
To connect live Supabase PostgreSQL backend:
1. Run `supabase/schema.sql` in your Supabase SQL Editor — it's the complete schema (tables, RLS policies, and the `family-photos` storage bucket) for a **brand-new** project, nothing else to run.
   - Already have an older project running? Apply `002_restrict_guest_writes.sql` → `003_photo_storage.sql` → `004_biography_legacy.sql` → `005_language_and_restoration.sql` in that order instead — each is idempotent (safe to re-run).
2. Copy `.env.example` to `.env` and set:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. When offline or without Supabase credentials, the application seamlessly runs in standalone local storage mode pre-seeded with the Kobia & Kiogora family dataset!

---

## ✅ Before you deploy

- [ ] **Run the full `schema.sql`** (see above) against your Supabase project — don't rely on partial/older migrations. It now includes the language dictionary, restoration codes, and the `family-photos` storage bucket.
- [ ] **Set real environment variables** on your hosting provider (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) — these are baked in at build time by Vite, so set them *before* running `npm run build`, not just at runtime.
- [ ] **Decide: local mode or Supabase for real family data.** Local/standalone mode (no env vars set) stores everything — including passwords — in the browser's `localStorage` with only base64 obfuscation, not real encryption. That's fine for a demo, but for a real family's data (names, dates, photos, addresses) use the Supabase-backed mode so data lives in a real, access-controlled database instead of one device's browser storage.
- [ ] **Known limitation — restoration codes in Supabase mode:** admins can generate a one-time restoration code (Admin Suite → User Management), and the "Have a restoration code?" flow on the login screen is built to redeem it. In **local mode** this works end-to-end. In **Supabase mode**, redeeming a code from a logged-out browser hits Supabase's Row Level Security as an anonymous request, which the current admin-only policy on `restoration_codes` will reject — so as shipped, restoring a password against a live Supabase backend needs a small Edge Function (or equivalent trusted server-side step) to perform the verified update instead of a direct client call. Flag this if you plan to run restoration codes against Supabase — happy to build that Edge Function if you want it before launch.
- [ ] **Replace the seed/demo data.** `src/data/seed.ts` ships with a fictional Kobia & Kiogora family for local mode and the "Explore Live Demo as Guest" button. Real deployments backed by Supabase start empty from the first sign-up (which becomes the family's `family_admin`) — no seed data is pushed to a live database.
- [ ] **Run `npm install && npm run build`** locally at least once before deploying, to confirm `tsc` type-checks cleanly and Vite produces a `dist/` you're happy with.
- [ ] **Point your host at `dist/`** (Vercel, Netlify, Cloudflare Pages, etc. all auto-detect a Vite app — build command `npm run build`, output directory `dist`).
- [ ] **Custom domain / HTTPS** if this is going in front of real users — most static hosts handle this for you once you add the domain.
- [ ] **Swap placeholder photos** — the seeded albums, avatars, and cover photos use Unsplash stock images and DiceBear generated avatars; a real family will want to replace these once they start adding their own members and photos (this happens naturally through the app's own upload flows, no code changes needed).
- [ ] **Sanity-check the six tree templates** with your actual family's data once it's in — tree shape (very wide vs. very tall families) can look different from the seeded example.

