import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// ---------------------------------------------------------------------------
// GitHub Pages base path — the repo name, not the product name ("Mizan").
// Override with VITE_BASE_PATH env var in CI.
//
// Capacitor build: the Android shell loads dist/ from disk via a custom
// scheme, not from a URL subpath — for that target we force base to '/'
// and skip the PWA service worker (VITE_CAPACITOR=true).
const IS_CAPACITOR = process.env.VITE_CAPACITOR === 'true'
const BASE_PATH = IS_CAPACITOR ? '/' : (process.env.VITE_BASE_PATH ?? '/mizan/')

export default defineConfig({
  base: BASE_PATH,
  server: {
    allowedHosts: ['.monkeycode-ai.live'],
  },
  plugins: [
    react(),
    ...(IS_CAPACITOR
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
            manifest: {
              name: 'Mizan',
              short_name: 'Mizan',
              description: 'Know exactly where every rupee goes, in under thirty seconds.',
              start_url: BASE_PATH,
              scope: BASE_PATH,
              display: 'standalone',
              orientation: 'any',
              theme_color: '#0F4D45', // Teal 900 — Primary
              background_color: '#FAF9F6', // Light surface token
              icons: [
                { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                {
                  src: 'icons/icon-maskable-512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
              ],
            },
            workbox: {
              // Offline-first (§4): precache the app shell so every core screen
              // works with zero network access after first load.
              globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
              navigateFallback: `${BASE_PATH}index.html`,
              cleanupOutdatedCaches: true,
            },
            devOptions: {
              enabled: false,
            },
          }),
        ]),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: true,
  },
})
