# Apex

Apex is a production-oriented commerce platform. This repository is the monorepo foundation: one Next.js application and empty packages with a fixed dependency direction.

## Requirements

- Node.js 20.9 or newer
- pnpm 11

## Scripts

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
```

`pnpm dev` starts the Next.js app in `apps/web`.

## Layout

```
apps/web          Next.js application (UI and HTTP)
packages/domain   Business rules, no frameworks
packages/application
packages/infrastructure
packages/database
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
