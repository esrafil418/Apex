# Database

Postgres access lives in `@apex/database`. Supabase hosts that Postgres. The query path is Drizzle, not the Supabase Data API.

## What exists

| Piece | Location |
| --- | --- |
| Server entry | `packages/database/src/index.ts` |
| Client and `select 1` ping | `packages/database/src/client.ts` |
| Env parsing | `packages/database/src/env.ts` |
| Schema source | `packages/database/src/schema` |
| SQL migrations | `packages/database/migrations` |
| Seed entry | `packages/database/src/seed.ts` |
| App import path | `apps/web/server/db.ts` |

The schema module has no tables. No commerce data is stored yet.

## Dependency direction

`@apex/database` depends on `@apex/domain` and on Drizzle. `@apex/domain` does not depend on `@apex/database` and does not import Drizzle, Postgres, or Supabase types. Row types stay in the database package. A feature maps a row to a domain value in the database package when that feature persists data.

`apps/web` imports `@apex/database` from `apps/web/server/db.ts`. UI components do not import the database package.

## Server boundary

`@apex/database` loads `server-only`. A client component that imports it fails the build. `DATABASE_URL` and `DIRECT_URL` have no `NEXT_PUBLIC_` prefix, so Next.js does not inline them into the browser bundle. The env parser rejects `NEXT_PUBLIC_DATABASE_URL` and `NEXT_PUBLIC_DIRECT_URL`.

The Next.js config does not copy database URLs into the `env` block. That block would ship them to the browser.

Scripts load env from the repository root. The Next.js process loads the same root directory. Credentials are read when a command or `getDatabase()` runs. `next build` does not open a connection.

## Connection roles

`getDatabase()` uses `DATABASE_URL` and keeps one pool on `globalThis` so development reloads do not open a pool per recompilation. `prepare` is false because the Supabase transaction pooler cannot use prepared statements. The pool allows 10 connections, idles them after 20 seconds, and fails a connect attempt after 10 seconds.

That URL is the database owner on Supabase. The owner bypasses row level security. This client is the trusted server connection.

`DIRECT_URL` is the session connection used by `drizzle-kit migrate`. Use the Supabase direct host or the session pooler (port 5432) there. Transaction mode (port 6543) belongs in `DATABASE_URL` for deployed app traffic. Local Postgres can set `DATABASE_URL` only.

## Transactions

Multi-statement work calls `getDatabase().transaction()`. The seed entry already opens one transaction and inserts nothing. Inventory decrements, checkout, and payment writes will use the same method when those features exist. Isolation and row locks will be chosen in that feature, next to the SQL that needs them.

## Row level security

No policies are installed. The architecture leaves room for them:

- Policies are SQL migrations in `packages/database/migrations`, committed with the table change.
- Application authorization stays in server-side use cases. It decides whether the current request may perform an operation.
- Database authorization is row level security. It still applies when a query runs as the authenticated database role, including a query the application did not intend.
- The owner connection used today bypasses those policies. Trusted server jobs keep using it. It never ships to the browser.
- When authentication exists, a user-scoped query will run inside a transaction on a non-owner role and set the request claims Supabase policies read (`auth.uid()`). That session helper is not implemented.

Application checks and row level security will both exist. One does not replace the other.

## Supabase

Supabase provides hosted Postgres and, later, Auth. This phase uses the Postgres connection string only. PostgREST, the Supabase JavaScript client, Storage, and Auth are not wired.

Another Postgres host can replace Supabase by changing `DATABASE_URL` and `DIRECT_URL`. There is no provider interface in front of Drizzle.

## Testing

`packages/database` unit tests cover env parsing and do not open a connection. Domain tests, when they exist, stay database-free.

Integration tests will run against PostgreSQL, using a dedicated test database and the seed entry or a transaction that rolls back. That harness is not built. CI runs `pnpm test` and `pnpm db:check` without a database URL.
