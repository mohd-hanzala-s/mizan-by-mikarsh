import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// ---------------------------------------------------------------------------
// Base path.
//
// - Vercel / Docker / local dev: root `/` (default).
// - Plain static host under a subpath: set VITE_BASE_PATH (e.g. `/mizan/`).
// - Capacitor build: the Android shell loads dist/ from disk via a custom
//   scheme, not from a URL subpath — for that target we force base to '/'
//   and skip the PWA service worker (VITE_CAPACITOR=true).
const IS_CAPACITOR = process.env.VITE_CAPACITOR === 'true'
const BASE_PATH = IS_CAPACITOR ? '/' : (process.env.VITE_BASE_PATH ?? '/')

export default defineConfig({
  base: BASE_PATH,
  server: {
    allowedHosts: ['.monkeycode-ai.live'],
  },
  preview: {
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
  build: {
    target: 'es2022',
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: true,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory'))
            return 'vendor-charts'
          if (id.includes('react-router')) return 'vendor-router'
          if (id.includes('react-dom') || id.includes('/react/')) return 'vendor-react'
          if (id.includes('zustand')) return 'vendor-state'
          if (id.includes('dexie')) return 'vendor-db'
          if (id.includes('date-fns')) return 'vendor-dates'
          if (id.includes('lucide-react')) return 'vendor-icons'
          return 'vendor'
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: true,
  },
})
