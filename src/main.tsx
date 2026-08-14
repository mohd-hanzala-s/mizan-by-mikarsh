import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { db } from './database/db'
import './index.css'

// Undo public/404.html's redirect encoding before React Router mounts.
;(function restorePathFromGithubPagesRedirect() {
  const params = new URLSearchParams(window.location.search)
  const redirect = params.get('redirect')
  if (redirect) {
    params.delete('redirect')
    const remaining = params.toString()
    const restoredPath = window.location.pathname.replace(/\/$/, '') + redirect
    window.history.replaceState(
      null,
      '',
      restoredPath + (remaining ? `?${remaining}` : '') + window.location.hash
    )
  }
})()

// Service worker registration only applies to the web/PWA build. The
// Android shell (apps/android, built via `build:capacitor`) bundles this
// app's assets directly and never installs a browser service worker — the
// virtual:pwa-register module doesn't exist in that build at all, so this
// import must stay dynamic and skipped rather than static.
if (!import.meta.env.VITE_CAPACITOR) {
  import('virtual:pwa-register').then(({ registerSW }) => registerSW({ immediate: true }))
}

// One-time pre-rename (`nexus-finance`) data migration, run before any
// repository opens the `mizan` database. Captures legacy rows into memory so
// the first `populate` seeds from them instead of defaults. No-op when the
// `mizan` database already exists or there is no legacy database.
db.migrateLegacyIfNeeded()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
