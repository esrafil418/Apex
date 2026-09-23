# Apex

Apex is a production-oriented commerce platform. This repository is a pnpm and Turborepo monorepo. The Next.js app is the only runtime, and Postgres access lives in `packages/database`.

## Requirements

- Node.js 20.9 or newer
- pnpm 11

## Scripts

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm test
pnpm build
```

`pnpm dev` starts the Next.js app in `apps/web`.

## Database

Copy `.env.example` to `.env.local` in the repository root. `DATABASE_URL` and `DIRECT_URL` are server-only.

```bash
pnpm db:generate
pnpm db:check
pnpm db:migrate
pnpm db:ping
pnpm db:seed
```

The first table is `profiles`. There is no catalog yet. Setup, migrations, and the server boundary are documented in [docs/development/database.md](docs/development/database.md). Roles and `changeRole` live in `packages/domain`. The current slice is the authorization kernel; see [docs/roadmap.md](docs/roadmap.md).

## Layout

```
apps/web          Next.js application (UI and HTTP)
packages/domain   Business rules, no frameworks
packages/application
packages/infrastructure
packages/database  Postgres client, schema, and migrations
packages/ui
packages/types
packages/validation
packages/config   Shared TypeScript config
e2e               End-to-end tests, not set up yet
docs              Architecture, decisions, API, development
```

Dependency direction and package rules are in [docs/architecture/overview.md](docs/architecture/overview.md).

## Graft

Graft is a local development context tool. It is not an application dependency. The generated graph in `graft/` is gitignored. Do not import it from `apps/web` or any package.
