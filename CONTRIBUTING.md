# Contributing to Mizan

Thanks for taking a look. This is a small monorepo with two targets that
share one codebase — most contributions only ever touch `apps/web`.

## Repo layout

```
apps/
  web/       React + Vite + Dexie app — the PWA, and the single source of
             UI/business logic for both targets.
  android/   Capacitor shell around apps/web's production build. Native
             config + the generated android/ Gradle project only.
```

See the root [README.md](README.md) for the full build/run instructions for
both targets, and `apps/web/docs/atlas-master-spec.md` for the product spec.

## Getting set up

```bash
npm install          # from the repo root — installs both workspaces
npm run dev:web       # http://localhost:5173
```

You don't need Android Studio or the Android SDK to work on `apps/web`.

## Before opening a PR

From the repo root:

```bash
npm run lint:web
npm run typecheck -w apps/web
npm run test:web
npm run build:web
```

All four should pass. CI runs the same checks (see
`.github/workflows/web-ci.yml`) and will re-run them on your PR regardless,
but running them locally first saves a round trip.

If your change affects the Android build specifically (Capacitor config,
native plugins, `apps/android/*`), also run:

```bash
npm run sync:android
```

and confirm the sync completes without errors. Full Gradle builds run in CI
(`.github/workflows/android-ci.yml`) since they need the Android SDK, which
most local dev setups won't have configured for this repo by default.

## Code style

- Prettier + ESLint are enforced (`npm run format`, `npm run lint:web`).
- The design-token check (`node scripts/check-design-tokens.mjs`, run as
  part of `lint:web`) rejects hardcoded colors/spacing outside the tokens
  defined in `apps/web/src/theme/`. Use the existing Tailwind tokens rather
  than one-off values.
- New features go in `apps/web/src/features/<feature-name>/`, following the
  existing pattern (a `*Page.tsx`, a Zustand store if the feature has
  cross-component state, and a matching test in `apps/web/src/tests/`).

## Tests

Vitest + Testing Library, run against `fake-indexeddb` so tests exercise the
same Dexie code paths as the real app. New services and pages should ship
with tests in `apps/web/src/tests/` — there's no dedicated integration
suite, so page-level tests are the main regression net.

## Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
(`feat:`, `fix:`, `docs:`, `chore:`, etc.) — enforced on PRs by
`.github/workflows/commitlint.yml`, and checkable locally:

```bash
echo "feat: add debt payoff planner" | npx commitlint
```

This isn't just style — `npm run changelog` (root) regenerates
`apps/web/CHANGELOG.md` from commit history using
`conventional-changelog-cli`, so `feat:`/`fix:` commits show up there
automatically. `npm run changelog:preview` prints what the next entry
would look like without writing anything, if you want to check before
committing.

## Reporting issues

Since this only has one primary maintainer today, the fastest path is
usually a PR rather than an issue — but issues are welcome for bugs you
can't fix yourself or feature discussion before a larger change.
