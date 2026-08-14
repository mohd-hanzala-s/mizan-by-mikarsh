# Mizan (monorepo)

Offline-first personal finance app. Everything stays on-device — no cloud,
no account, no tracking. Two targets share one codebase:

```
apps/
  web/       React 19 + Vite + Dexie (IndexedDB) app — the PWA, and the
             single source of UI/business logic for both targets.
  android/   Capacitor shell around apps/web's production build. Holds
             only native config (capacitor.config.ts) + the generated
             android/ Gradle project. No app logic lives here.
packages/
  types, utils, theme
```

The Android app is **not** a rewrite — it's the same React/Dexie app running
inside a WebView via [Capacitor](https://capacitorjs.com), so every feature,
test, and future change in `apps/web` ships to Android for free after a sync.

## Prerequisites

- Node.js 20+
- pnpm 9+ (enabled via `corepack enable`)
- For building the Android app: Android Studio (JDK 17+, Android SDK 36)

## Install

```bash
corepack enable
pnpm install
```

## Commands

| Command             | What it does                            |
| ------------------- | --------------------------------------- |
| `pnpm dev`          | Vite dev server (web only, HMR)         |
| `pnpm build`        | Build all packages via Turbo            |
| `pnpm lint`         | Lint all packages                       |
| `pnpm typecheck`    | Type-check all packages                 |
| `pnpm test`         | Run web tests (Vitest)                  |
| `pnpm format`       | Prettier-format all files               |
| `pnpm format:check` | Check formatting (CI gate)              |
| `pnpm sync:android` | Build web (Capacitor mode) + `cap sync` |
| `pnpm android:dev`  | Sync + open Android Studio              |

## Deploying the web app

### Vercel (recommended)

The repo is Vercel-ready out of the box. `vercel.json` configures the pnpm
install, the `@mizan/web` build, the `apps/web/dist` output, SPA rewrites, and
security headers. Base path defaults to `/`.

1. Push this repo to GitHub.
2. In Vercel, **Import Project** → select the GitHub repo. Vercel detects the
   pnpm workspace and picks up `vercel.json` automatically.
3. Deploy. No environment variables are required.

## Building the Android app

```bash
pnpm sync:android   # builds apps/web (Capacitor mode) + `cap sync android`
pnpm android:dev    # or: sync + open Android Studio
```

Then open `apps/android/android` in Android Studio and press **Run** ▶ (choose
an emulator or a USB device). The default build variant is `debug`, which needs
no keystore.

**Run `pnpm sync:android` again any time `apps/web` changes** — Capacitor copies
the web build into the native project; it does not watch for changes.

### Notes for a clean Android Studio build

- **Run `pnpm install` + `pnpm sync:android` first.** The generated
  `capacitor.settings.gradle` references `node_modules/.pnpm/...` at the repo
  root; those paths only exist after install + sync.
- **Release signing is optional.** `app/build.gradle` signs release builds with
  a local `release.keystore` when present, and otherwise falls back to debug
  signing — so `assembleRelease` and _Build > Generate Signed Bundle_ work on a
  fresh clone without a keystore.
- **To ship a real release build**, drop `release.keystore` in
  `apps/android/android/app/` and export `KEYSTORE_PASSWORD`, `KEY_ALIAS`, and
  `KEY_PASSWORD` (the file is git-ignored).
- **Push notifications** are optional: the `google-services` Gradle plugin is
  applied only when `google-services.json` exists, so its absence never breaks
  the build.
- The manifest disables cleartext traffic and enables device biometrics
  (`USE_BIOMETRIC`) for the app-lock unlock flow.

### Why a separate build mode for Android?

`apps/web` builds two slightly different outputs from the same source, switched
by the `VITE_CAPACITOR` env var:

|                | `pnpm build` (web/PWA)         | `pnpm build:capacitor` (Android)                                                                                        |
| -------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Base path      | `VITE_BASE_PATH` (default `/`) | `/`                                                                                                                     |
| Service worker | Registered (offline caching)   | Skipped — Capacitor bundles assets locally; a browser SW would be redundant and can cause stale-content bugs in WebView |

Nothing else differs — same components, same Dexie database, same services.

### App identity

- Package / App ID: `com.mikarsh.mizan`
- Icons / splash: generated from `apps/web/public/icons/*` via
  `npx @capacitor/assets generate --android` (run from `apps/android`); re-run
  if the source icons change.

## CI

- `.github/workflows/web-ci.yml` — lint, format check, typecheck, test, build
  on push/PR to `main`.
- `.github/workflows/android-ci.yml` — builds a debug APK, uploaded as a
  workflow artifact.
- `.github/workflows/commitlint.yml` — lints PR commits against
  [Conventional Commits](https://www.conventionalcommits.org/).

See [CONTRIBUTING.md](CONTRIBUTING.md) for local equivalents and the changesets
versioning workflow.

## License

MIT — see [LICENSE](LICENSE).
