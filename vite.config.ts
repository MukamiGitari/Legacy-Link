import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Turns Legacy Link into an installable, offline-capable app: precaches the
    // built app shell (JS/CSS/HTML) plus every photo/icon in public/, and
    // registers a service worker that serves them from cache when there's no
    // connection. Family data itself already works offline via the local
    // (non-Supabase) storage mode in src/lib/localAuth.ts — this is what makes
    // the *app itself* load with no network too.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'Legacy Link — Our Roots, Our Story, Our Legacy',
        short_name: 'Legacy Link',
        description: 'Preserve your history. Connect generations. Keep your memories alive.',
        theme_color: '#1F3D2B',
        background_color: '#F5EFE3',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell and every photo shipped in public/photos so
        // albums render even fully offline after the first visit.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,ico,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    host: true
  }
});
