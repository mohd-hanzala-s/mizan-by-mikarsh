# Mizan (monorepo)

Offline-first personal finance app. Everything stays on-device — no cloud,
no account. Two targets share one codebase:

```
apps/
  web/       React 19 + Vite + Dexie (IndexedDB) app — the PWA, and the
             single source of UI/business logic for both targets.
  android/   Capacitor shell around apps/web's production build. Holds
             only native config (capacitor.config.ts) + the generated
             android/ Gradle project. No app logic lives here.
```

The Android app is **not** a rewrite — it's the same React/Dexie app
running inside a WebView via [Capacitor](https://capacitorjs.com), so every
feature, test, and future change in `apps/web` ships to Android for free
after a sync.

## Prerequisites

- Node.js 20+
- For building/running the Android app: Android Studio (or the Android
  SDK + a JDK 21) — not needed to work on `apps/web` alone.

## Install

From the repo root (installs both workspaces):

```bash
npm install
```

## Working on the web app

```bash
npm run dev:web      # http://localhost:5173, HMR
npm run test:web
npm run lint:web
npm run build:web    # production PWA build → apps/web/dist
```

These are unchanged from before the Android app existed — nothing about
`apps/web`'s day-to-day workflow is different.

## Building/running the Android app

```bash
npm run sync:android   # builds apps/web (Capacitor mode) + `cap sync android`
npm run open:android    # opens apps/android/android in Android Studio
# or, both in one step:
npm run dev:android
```

Then Run ▶ in Android Studio (emulator or a USB-connected device).

**Run `sync:android` again any time `apps/web` changes** — Capacitor
copies the web build into the native project; it does not watch for
changes automatically.

### Why a separate build mode for Android?

`apps/web` builds two slightly different outputs from the same source,
switched by the `VITE_CAPACITOR` env var (see `apps/web/vite.config.ts` and
`apps/web/src/main.tsx`):

| | `npm run build` (web/PWA) | `npm run build:capacitor` (Android) |
|---|---|---|
| Base path | `VITE_BASE_PATH` (GitHub Pages subpath) | `/` |
| Service worker | Registered (offline caching for the browser) | Skipped — Capacitor bundles assets locally; a browser SW would just be redundant and can cause stale-content bugs in a WebView |

Nothing else differs — same components, same Dexie database, same
services, same tests.

### App identity

- Package/App ID: `com.mikarsh.mizan` (`apps/android/capacitor.config.ts`)
- Icons/splash: generated from `apps/web/public/icons/*` via
  `npx capacitor-assets generate --android` (run from `apps/android`) —
  re-run that if the source icons change.

### Native permissions

The generated `AndroidManifest.xml` only requests `INTERNET`, which
Capacitor's template adds by default. Mizan itself makes no network calls
(everything is local IndexedDB), so this can likely be removed if you want
the manifest to reflect that — just confirm no installed Capacitor plugin
needs it first.

## Adding native (Capacitor) plugins later

Install into `apps/android` specifically (not the root), e.g.:

```bash
npm install @capacitor/haptics -w apps/android
npm run sync:android
```

Calls into native plugins from `apps/web` code should be dynamically
imported and gated behind `import.meta.env.VITE_CAPACITOR` (see the
service-worker registration in `apps/web/src/main.tsx` for the pattern) —
that keeps `@capacitor/*` packages out of the plain web bundle entirely.

## Everything else

`apps/web/README.md`, `apps/web/docs/atlas-master-spec.md`, and
`apps/web/CHANGELOG.md` still describe the product/feature history and
haven't moved in meaning, only in path.

## CI

- `.github/workflows/web-ci.yml` — lint, format check, typecheck, test,
  build on every push/PR touching `apps/web`; deploys to GitHub Pages on
  push to `main`.
- `.github/workflows/android-ci.yml` — builds a debug APK on every
  push/PR touching `apps/android` or `apps/web`, uploaded as a workflow
  artifact.
- `.github/workflows/commitlint.yml` — lints every commit in a PR against
  [Conventional Commits](https://www.conventionalcommits.org/).

See [CONTRIBUTING.md](CONTRIBUTING.md) for the local equivalent of these
checks before opening a PR, and for the `npm run changelog` workflow.

## License

MIT — see [LICENSE](LICENSE). This was the default choice for "GitHub
readiness"; swap it for something else (or add a private/proprietary
notice instead) if that doesn't match your intent for this project,
especially given it's a personal-finance app.
