# MIZAN — AI Agent Guide

## Project Overview

Mizan is an offline-first personal finance PWA and Android application. All data lives in the browser's IndexedDB via Dexie.js. There are no network APIs, no trackers, and no telemetry. The app works entirely offline after the initial PWA installation.

**Tagline**: "Know exactly where every rupee goes, in under thirty seconds."

**Package**: `@mizan/web` v2.0.0 (monorepo root: `mizan-monorepo`)

---

## Architecture

### Monorepo Structure

```
mizan-monorepo/
├── apps/
│   ├── web/          React 19 + TypeScript + Vite PWA (main application)
│   └── android/      Capacitor 8 Android wrapper shell
├── packages/
│   ├── types/        @mizan/types — all domain entity types
│   ├── utils/        @mizan/utils — shared utilities (currency, etc.)
│   └── theme/        @mizan/theme — design tokens, Tailwind config, chart colors
```

**Monorepo tooling**: Turborepo (`turbo` ^2.5.6) + pnpm workspaces (`pnpm` 9.15.4, `node` >= 20)

### Layered Architecture (inside `apps/web/src/`)

```
database/    Dexie schema (db.ts) — single source of truth for IndexedDB schema
    ↓
repositories/   Thin Dexie wrappers (CRUD + soft-delete filtering)
    ↓
services/       Business logic layer (aggregations, calculations, rules)
    ↓
features/*/ stores  Zustand stores — load() pattern fetches via services/repos
    ↓
features/*/ pages   React components — consume stores, render UI
```

**Rule**: Feature components never import `db` directly. Always go through Repository or Service layers.

---

## Tech Stack

| Category           | Technology                                               | Version |
| ------------------ | -------------------------------------------------------- | ------- |
| UI Framework       | React                                                    | ^19.2.8 |
| Bundler            | Vite                                                     | ^8.2.0  |
| Language           | TypeScript                                               | ~6.0.2  |
| Styling            | Tailwind CSS                                             | ^3.4.19 |
| State              | Zustand                                                  | ^5.0.14 |
| Database           | Dexie.js                                                 | ^4.4.4  |
| Routing            | react-router-dom                                         | ^6.30.4 |
| Icons              | lucide-react                                             | ^1.28.0 |
| Dates              | date-fns                                                 | ^4.4.0  |
| Utilities          | clsx + class-variance-authority + tailwind-merge         | —       |
| PWA                | vite-plugin-pwa                                          | ^1.3.0  |
| Mobile             | @capacitor/core                                          | ^8.5.0  |
| Font               | @fontsource-variable/inter                               | ^5.3.0  |
| Testing            | Vitest + jsdom + fake-indexeddb + @testing-library/react | —       |
| Linting            | ESLint ^10 + typescript-eslint ^8                        | —       |
| Formatting         | Prettier ^3.9.6                                          | —       |
| Git hooks          | Husky ^9                                                 | —       |
| Commit conventions | @commitlint/config-conventional                          | —       |
| Versioning         | @changesets/cli                                          | —       |

---

## Folder Structure (`apps/web/src/`)

```
src/
├── App.tsx                  Root component (loading → error → onboarding → lock → router)
├── main.tsx                 Vite entry point
├── index.css                Global styles + Tailwind directives
├── app/
│   └── settingsStore.ts     Global settings Zustand store
├── components/
│   ├── charts/              Recharts-based chart components
│   ├── common/              AppLockScreen, EmptyState, ErrorState, LoadingScreen, Skeleton, Toast, DynamicIcon, ConfirmationDialog
│   ├── finance/             Domain components: AccountCard, AlertCard, BudgetCard, DashboardCard, GoalCard, TransactionView
│   ├── forms/               Form input components
│   ├── layout/              AppShell, BottomNavigation, BottomSheet, FAB, MoreSheet, NavigationRail, TopAppBar
│   ├── search/              Search components
│   └── ui/                  button.tsx (primitive UI components)
├── constants/               Seed data (DEFAULT_ACCOUNTS, DEFAULT_CATEGORIES, DEFAULT_SETTINGS)
├── database/
│   └── db.ts                Dexie schema — 18 object stores, migration logic
├── features/                28 feature modules (see below)
├── hooks/                   useDebounce, useGreeting, useInstallPrompt, useToast
├── repositories/            12 repository modules (thin Dexie wrappers)
├── routes/
│   └── router.tsx           React Router route definitions
├── services/                28 service modules (business logic)
├── tests/                   45 test files, test setup
├── theme/                   ThemeProvider, tokens.css, chartColors.ts
├── types/                   Local entity type re-exports
└── utils/                   Local utilities (currency formatting, etc.)
```

### Features (`src/features/`)

```
about/  accounts/  analytics/  automation/  billsplit/  budgets/
calendar/  command/  dashboard/  goals/  insights/  investments/
loans/  money/  more/  not-found/  notifications/  onboarding/
planner/  profile/  recurring/  replay/  reports/  settings/
simulator/  transactions/  vault/  wealth/
```

Each feature module contains:

- `*Page.tsx` — page-level component with Loading/Empty/Error states
- `*Store.ts` — Zustand store (if stateful)
- `*Sheet.tsx`, `*Card.tsx`, `*Input.tsx` — feature-specific components

---

## Coding Rules

### TypeScript

- **Strict mode**: `noUnusedLocals: true`, `noUnusedParameters: true`, `erasableSyntaxOnly: true`, `noFallthroughCasesInSwitch: true`
- **Target**: ES2023, `moduleResolution: "bundler"`, `verbatimModuleSyntax: true`
- **No `any`**: Always use explicit types. ESLint `no-unused-vars` warns (args prefixed with `_` are ignored).
- **All entity types** are defined in `packages/types/index.ts` (`@mizan/types`). Import from `@/types/entities` in web code.
- **Type imports**: Use `import type { Foo } from '...'` for type-only imports (verbatimModuleSyntax enforces this).

### React

- **Functional components only** — no class components, no default exports, use named exports.
- **Every page must handle three states**:
  1. `isLoading` → render `<LoadingScreen />` or `<SkeletonPage />`
  2. `isError` → render `<ErrorState />` with `onRetry`
  3. Empty data → render `<EmptyState />` with an action CTA
- **No inline styles** — use Tailwind classes exclusively.
- **`tabular-nums` on all monetary amounts** (`className="tabular-nums"`).
- **App.tsx pattern** for root: `isLoading → isError → settings check → onboarding → lock screen → BrowserRouter`

### Imports

- **Alias**: `@/` maps to `apps/web/src/` (configured in both `vite.config.ts` and `tsconfig.app.json`)
- **Shared packages**: `@mizan/types`, `@mizan/utils`, `@mizan/theme` — never import sibling source files directly across packages.
- **Feature isolation**: Feature pages import from `@/services/*`, `@/repositories/*`, but never from `@/database/db` directly.
- **Repository pattern**: `@/repositories/*` wraps `@/database/db` — services call repositories, stores call services.

### Naming Conventions

| Category         | Convention                              | Example                                     |
| ---------------- | --------------------------------------- | ------------------------------------------- |
| Components       | PascalCase                              | `TransactionCard`, `AppShell`               |
| Types/interfaces | PascalCase                              | `Transaction`, `AccountType`                |
| Functions        | camelCase                               | `computeMetrics`, `formatAmount`            |
| Variables        | camelCase                               | `hiddenAtRef`, `isLoading`                  |
| Hooks            | camelCase, `use` prefix                 | `useGreeting`, `useDebounce`                |
| Zustand stores   | camelCase, `use` prefix, `Store` suffix | `useTransactionsStore`, `useSettingsStore`  |
| File names       | kebab-case                              | `transaction-card.tsx`, `settings-store.ts` |
| Constants        | UPPER_SNAKE_CASE                        | `DEFAULT_CATEGORIES`, `UNDO_WINDOW_MS`      |
| Repositories     | PascalCase, `Repository` suffix         | `TransactionRepository`                     |
| Services         | PascalCase, `Service` suffix            | `TransactionService`                        |

### Component Rules

- One main component per file (private helper components in the same file are fine if small).
- Props interface must be exported: `export interface TransactionCardProps { ... }`
- Tailwind classes inline (no CSS modules or styled-components).
- Use the `cn()` utility (from `clsx` + `tailwind-merge`) for conditional class merging.
- `ErrorBoundary` wrapping is expected around every feature page route.

### State Management

- **Zustand** for all client state. No React Context for data fetching, no Redux.
- One store per feature domain. File naming: `featureNameStore.ts` (e.g., `transactionsStore.ts`, `accountsStore.ts`).
- Every async store has a `load()` method — call it in `useEffect` or via `useRef` for mount-only effects.
- Store hook export pattern: `export const useFeatureStore = create<FeatureState>(...)`
- Store interface pattern:
  ```ts
  interface FeatureState {
    data: Entity[]
    isLoading: boolean
    isError: boolean
    error: string | null
    load: () => Promise<void>
    // ... domain actions
  }
  ```
- **Mount-only load**: `const load = useStore.getState().load; useEffect(() => { load(); }, [load])` — avoids stale closure issues.
- Refs for non-reactive state: `const ref = useRef<T | null>(null)` for values that shouldn't trigger re-renders.

---

## Brand Guide

### Colors

| Token                             | Hex       | Usage                                   |
| --------------------------------- | --------- | --------------------------------------- |
| `brand-teal900` / `brand-primary` | `#0F4D45` | Primary brand, headers, FAB, navigation |
| `brand-teal400` / `brand-mint`    | `#62C3A7` | Accent, income indicators               |
| `brand-gold` / `gold-500`         | `#D9A441` | Highlights, warnings, CTAs              |
| `expense`                         | `#D9534F` | Expense amounts, debit indicators       |
| `income`                          | `#62C3A7` | Income amounts, credit indicators       |
| `warning`                         | `#D9A441` | Warning states                          |
| `info`                            | `#2F9A8A` | Info indicators                         |
| `liability`                       | `#8B6F9E` | Loan/debt indicators                    |

### Semantic Tokens (CSS variables)

- `--surface`, `--surface-card`, `--surface-raised` — background layers
- `--border`, `--border-subtle` — border colors
- `--text-primary`, `--text-secondary`, `--text-tertiary` — text hierarchy
- `--color-accent`, `--color-accent-muted`, `--color-accent-hover` — accent system

### Design Ratio

**60/30/10**: 60% neutral surface tones, 30% teal brand, 10% gold accents.

### Typography

- **Font**: Inter Variable only (body + headings via `fontFamily.sans` / `fontFamily.heading`).
- **Mono**: IBM Plex Mono (for account numbers, codes).
- **Sizes**: `display` (2.25rem), `h1` (1.75rem), `h2` (1.375rem), `h3` (1.125rem), `body-lg` (1rem), `body` (0.875rem), `body-sm` (0.8125rem), `caption` (0.75rem), `overline` (0.6875rem).
- **`tabular-nums`** on any element displaying numeric amounts.

### Shadows

| Token            | Usage                 |
| ---------------- | --------------------- |
| `shadow-sm`      | Cards, list items     |
| `shadow-md`      | Elevated cards        |
| `shadow-lg`      | Dropdowns, popovers   |
| `shadow-input`   | Input fields          |
| `shadow-modal`   | Modals, bottom sheets |
| `shadow-pressed` | Pressed buttons       |
| `shadow-flat`    | No shadow             |

Dark mode variants: `shadow-dark-sm`, `shadow-dark-md`, `shadow-dark-lg`, `shadow-dark-modal`.

### Border Radius

`sm` (8px), `md` (12px), `lg` (16px), `xl` (20px), `2xl` (24px), `3xl` (32px), `full` (9999px).

### Spacing Scale

4px base grid: 0, px, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 44, 48, 56, 64, 80, 96, 128, 192.

---

## Build Commands

| Command             | Directory | Description                           |
| ------------------- | --------- | ------------------------------------- |
| `pnpm dev`          | root      | Start Vite dev server (web only)      |
| `pnpm build`        | root      | Build all packages via Turbo          |
| `pnpm test`         | root      | Run all Vitest tests                  |
| `pnpm lint`         | root      | Lint all packages                     |
| `pnpm typecheck`    | root      | TypeScript type-check all packages    |
| `pnpm sync:android` | root      | Build web + sync to Capacitor Android |
| `pnpm android:dev`  | root      | Sync + open Android Studio            |
| `pnpm clean`        | root      | Clean all build outputs               |
| `pnpm format`       | root      | Prettier format all files             |
| `pnpm format:check` | root      | Check formatting (CI)                 |

**Individual package commands** (inside `apps/web/`):

- `pnpm dev` — Vite dev server
- `pnpm build` — `tsc -b && vite build`
- `pnpm build:capacitor` — `tsc -b && VITE_CAPACITOR=true vite build` (no PWA service worker)
- `pnpm test` — Vitest run
- `pnpm test:watch` — Vitest watch mode
- `pnpm typecheck` — `tsc -b --noEmit`

---

## Testing

- **Framework**: Vitest (^4.1.10) with `jsdom` environment, `globals: true`
- **IndexedDB mocking**: `fake-indexeddb/auto` in `src/tests/setup.ts`
- **DOM assertions**: `@testing-library/jest-dom/vitest`
- **Location**: All tests in `apps/web/src/tests/`
- **Naming**: `*.test.ts` (unit/service tests), `*.test.tsx` (component/page tests)
- **45 test files** covering: services (account, transaction, budget, goal, loan, investment, recurring, bill-split, backup, categorization, etc.) and page-level integration tests

### Test Setup (`src/tests/setup.ts`)

```ts
import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'
// matchMedia polyfill for jsdom
```

---

## Deployment

### Web (PWA)

- **Platform**: Vercel (`vercel.json`, base path `/`) and Docker + nginx (`Dockerfile`)
- **CI**: `.github/workflows/web-ci.yml` — lint, format check, typecheck, test, build on push/PR to `main`
- **PWA**: Service worker via `vite-plugin-pwa` with auto-update, offline precaching of app shell
- **Capacitor exception**: `VITE_CAPACITOR=true` forces `base: '/'` and disables service worker registration

### Android

- **Platform**: Capacitor 8 Android wrapper (`com.mikarsh.mizan`)
- **CI**: `.github/workflows/android-ci.yml` — builds debug APK on push/PR to `main`
- **Architecture**: Android shell loads `apps/web/dist` from disk via `https://` scheme
- **Sync workflow**: Build web → `npx cap sync android` → `npx cap open android`

---

## Key Constraints

1. **Fully offline-first**: No network requests, no API calls, no cloud sync. All data is local IndexedDB.
2. **No tracking, no telemetry**: Zero analytics, zero error reporting services.
3. **IndexedDB via Dexie**: 18 object stores with explicit schema versioning. Soft deletes (`isDeleted: boolean`) throughout.
4. **PWA**: Service worker precaches app shell for full offline capability.
5. **Multi-currency display-only**: Accounts can have different ISO 4217 currencies. Amounts are never converted between currencies. Aggregates across mixes flag the mismatch rather than silently summing.
6. **No third-party auth**: All authentication is local (PIN lock).
7. **Sample data**: `SampleDataService.fulfillIfRequested()` generates demo data on first run if opted in during onboarding.
8. **Legacy migration**: Data from `nexus-finance` IndexedDB database is auto-migrated to `mizan` on first launch.

---

## Common Patterns

### Zustand Store with load()

```ts
import { create } from 'zustand'
import { FeatureRepository } from '@/repositories/FeatureRepository'
import { FeatureService } from '@/services/FeatureService'
import type { Entity } from '@/types/entities'

interface FeatureState {
  items: Entity[]
  isLoading: boolean
  isError: boolean
  error: string | null
  load: () => Promise<void>
  create: (input: CreateInput) => Promise<void>
}

export const useFeatureStore = create<FeatureState>((set, get) => ({
  items: [],
  isLoading: true,
  isError: false,
  error: null,

  load: async () => {
    set({ isLoading: true, isError: false, error: null })
    try {
      const items = await FeatureRepository.getAll()
      set({ items, isLoading: false })
    } catch (err) {
      set({
        isLoading: false,
        isError: true,
        error: err instanceof Error ? err.message : 'Failed to load',
      })
    }
  },

  create: async (input) => {
    const item = FeatureService.create(input)
    await FeatureRepository.add(item)
    set((s) => ({ items: [...s.items, item] }))
  },
}))
```

### Page Component Structure

```tsx
export function FeaturePage() {
  const { items, isLoading, isError, error, load } = useFeatureStore()
  const loadFn = useRef(useFeatureStore.getState().load)

  useEffect(() => {
    loadFn.current()
  }, [])

  if (isLoading) return <SkeletonPage />
  if (isError) return <ErrorState message={error ?? 'Failed to load'} onRetry={() => load()} />
  if (items.length === 0)
    return <EmptyState title="No items" action={{ label: 'Add', onClick: () => {} }} />

  return <div>...</div>
}
```

### Repository Pattern

```ts
// Repositories are plain objects (not classes) with static method groups
export const FeatureRepository = {
  async getAll(): Promise<Entity[]> { ... },
  async getById(id: string): Promise<Entity | undefined> { ... },
  async add(entity: Entity): Promise<void> { ... },
  async update(id: string, patch: Partial<Entity>): Promise<void> { ... },
}
```

---

## Danger Zone (Do Not Do)

- Do not import `db` directly from feature components — use repositories
- Do not use `any` — TypeScript strict mode is enforced
- Do not use inline styles — Tailwind only
- Do not skip Loading/Empty/Error states on pages
- Do not use default exports (named exports only)
- Do not write CSS files (use Tailwind + `index.css` + `tokens.css`)
- Do not add network APIs or online dependencies (offline-first constraint)
- Do not add tracking, analytics, or telemetry
- Do not mix currency amounts in aggregations without checking `haveSameCurrency()`
