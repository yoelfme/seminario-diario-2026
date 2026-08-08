# Seminario 2026 — Monorepo

A [Turborepo](https://turborepo.com) monorepo with a Next.js landing page and a
shared design system, set up with best-practice tooling from day one.

## What's inside

### Apps

- **`apps/landing`** — Next.js 16 (App Router) landing page. Consumes the shared
  UI package to prove cross-package reuse end-to-end.

### Packages

- **`@repo/ui`** — Shared design system (React + Tailwind v4 + shadcn/ui). Ships
  components as source; apps transpile them. Add more with the shadcn CLI:
  `pnpm dlx shadcn@latest add <component>` (run from `packages/ui`).
- **`@repo/tailwind-config`** — Single source of truth for Tailwind v4 design
  tokens (colors, radii, fonts) and the shared PostCSS config.
- **`@repo/eslint-config`** — Shared ESLint 10 flat configs (`base`, `next`,
  `react-internal`), Prettier-compatible.
- **`@repo/typescript-config`** — Shared `tsconfig` bases.

## Tech stack

| Concern    | Choice                              |
| ---------- | ----------------------------------- |
| Monorepo   | Turborepo + pnpm workspaces         |
| Framework  | Next.js 16 (App Router, React 19)   |
| Styling    | Tailwind CSS v4 + shadcn/ui         |
| Language   | TypeScript 5.9                      |
| Linting    | ESLint 10 (flat config)             |
| Formatting | Prettier (+ Tailwind class sorting) |
| Git hooks  | Husky + lint-staged                 |
| Unit tests | Vitest + Testing Library            |
| E2E tests  | Playwright                          |
| CI         | GitHub Actions                      |

> **Note:** TypeScript is pinned to 5.9 (not 7.x) because `typescript-eslint`
> does not yet support TypeScript 7. Bump it once that support lands.

## Getting started

```bash
pnpm install          # install deps + set up git hooks
pnpm dev              # run all apps in dev mode (landing on :3000)
```

## Common commands

```bash
pnpm build            # build every app/package (cached)
pnpm lint             # lint everything
pnpm check-types      # type-check everything
pnpm test             # run unit tests (Vitest)
pnpm test:e2e         # run Playwright e2e tests
pnpm format           # format the whole repo with Prettier
pnpm format:check     # verify formatting
```

Scope a task to one workspace with `--filter`, e.g.
`pnpm --filter @app/landing dev`.

## Adding a new frontend app

1. Create `apps/<name>` with its own `package.json`.
2. Depend on `@repo/ui`, `@repo/tailwind-config`, `@repo/eslint-config`, and
   `@repo/typescript-config` via `workspace:*`.
3. Import `@repo/ui/styles.css` in your global stylesheet and start composing
   with the shared components.
