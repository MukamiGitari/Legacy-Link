# Deploying the Family Gallery + Family Cookbook update

This folder only contains the files that changed — copy them into your
project at the **same relative paths** shown below, then follow the steps
for your setup.

## 1. Files in this folder

```
src/types/index.ts                                  (changed)
src/lib/albumCovers.ts                               (changed)
src/index.css                                        (changed)
src/components/gallery/AddAlbumModal.tsx             (changed)
src/components/layout/Sidebar.tsx                    (changed)
src/components/layout/Topbar.tsx                     (changed)
src/pages/Gallery.tsx                                (changed)
src/pages/Cookbook.tsx                                (changed)
public/covers/cover-graduations.svg                   (new file)
supabase/015_album_categories_add_graduations.sql     (new migration)
README.md                                             (changed)
```

## 2. One file to DELETE

`src/components/cookbook/AddCookbookAlbumModal.tsx` is no longer used
(there's only one cookbook now, so there's no "create a new cookbook"
modal). Delete this file from your project — it isn't included here.

## 3. Copy the files into your project

In your local copy of the website's code (the same repo your live site
deploys from):

1. Copy every file listed in step 1 into the matching folder, overwriting
   the existing versions.
2. Delete `src/components/cookbook/AddCookbookAlbumModal.tsx`.
3. Double check nothing else in your project imports
   `AddCookbookAlbumModal` (it shouldn't, since `Cookbook.tsx` no longer
   references it).

## 4. Apply the database migration (Supabase)

The new "Graduations" photo category needs one small database change —
without this step, creating a Graduations album (or, previously,
a Birthdays album) will fail with a database error even though the
website itself looks fine.

**Option A — Supabase Dashboard (easiest):**
1. Go to your Supabase project → **SQL Editor**.
2. Open `supabase/015_album_categories_add_graduations.sql` from this
   folder, copy its contents, paste into a new query, and run it.

**Option B — Supabase CLI (if you use one):**
```bash
supabase db push
```
(as long as your local `supabase/` migrations folder now includes this
new `015_...sql` file alongside your existing ones).

## 5. Rebuild and deploy the site

This depends on how your site is hosted:

**If your host auto-deploys from Git (Vercel, Netlify, etc.):**
1. Commit the changed files (and the deletion) to your repository.
2. Push to the branch your host watches (usually `main`).
3. The host will automatically rebuild and deploy — no manual build step
   needed.

**If you deploy manually (build locally, upload the output):**
```bash
npm install       # only needed if you haven't already
npm run build      # produces the production build (usually in /dist)
```
Then upload the contents of the build output folder to your host exactly
as you normally do.

## 6. After deploying — quick check

- Open the site and confirm the sidebar/top bar now say **"Family
  Gallery"** instead of "Photo Gallery."
- Click into Family Gallery: you should land on a grid of categories
  (Childhood, Birthdays, Graduations, Weddings, Legends/History,
  Reunions, Memorials, Holidays), each opening into that category's
  albums with a page-turn animation.
- Try creating a new album under **Graduations** specifically — this is
  the one that depends on the database migration from step 4. If it
  errors, double-check that migration ran successfully.
- Open **Family Cookbook**: it should go straight into the Breakfast /
  Main meals / Snacks / Desserts slider, with no "create a new cookbook"
  screen beforehand.

## Rollback

If something looks wrong, restoring the previous versions of the files
listed in step 1, re-adding `AddCookbookAlbumModal.tsx`, and redeploying
will put the site back to how it was before this update. The database
migration is additive (it only widens an existing rule) and doesn't need
to be reversed.
