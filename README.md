# Legacy Link (🌿)
> *"Our Roots, Our Story, Our Legacy."*

A production-ready digital family heritage archive, genealogy platform, and multi-template family tree system built with React, Vite, Tailwind CSS, Cloudflare Workers, Neon PostgreSQL, and Cloudflare R2 object storage.

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

### 3. 📸 Family Media, Storytelling & Voice Notes
- **Family Photo Gallery**: Album categorization (*Weddings, Reunions, Childhood, Historical, Memorials, Graduations, Birthdays*) with full-screen lightbox viewer and member face-tag navigation.
- **Heritage Vault with Voice Notes**: Dialect dictionary, family sayings, proverbs, riddles, and in-browser audio recording/playback.
- **Family Memories**: Storytelling format with photos and author attribution.
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
npm install
npm run dev
```

### Building for Production
```bash
npm run build
```

---

## 🗃️ Backend & Database Architecture

- **Backend API**: Cloudflare Worker (`worker/`) running Hono at `https://legacy-link-api.heritagehub.workers.dev`.
- **Database**: PostgreSQL on **Neon** (`neon/schema.sql`).
- **Media & Audio Storage**: **Cloudflare R2** with direct client presigned uploads.
- **Environment Config**: Set `VITE_API_URL` to point to your live Cloudflare Worker API.
