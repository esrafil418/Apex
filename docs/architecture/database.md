# Database

Postgres access lives in `@apex/database`. Supabase hosts that Postgres. The query path is Drizzle, not the Supabase Data API.

## What exists

| Piece | Location |
| --- | --- |
| Server entry | `packages/database/src/index.ts` |
| Client and `select 1` ping | `packages/database/src/client.ts` |
| User-scoped transaction | `packages/database/src/with-user.ts` |
| Env parsing | `packages/database/src/env.ts` |
| Schema source | `packages/database/src/schema` |
| Profile row mapper | `packages/database/src/profile.ts` |
| SQL migrations | `packages/database/migrations` |
| Seed entry | `packages/database/src/seed.ts` |
| App import path | `apps/web/server/db.ts` |

The first table is `profiles`. There is no product, cart, or order schema.

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

Trusted multi-statement work calls `getDatabase().transaction()`. User-scoped work calls `withUser`, which opens a transaction, sets `app.user_id`, then `SET LOCAL ROLE apex_app`. Inventory decrements, checkout, and payment writes will use a transaction when those features exist. Isolation and row locks will be chosen in that feature, next to the SQL that needs them.

## Row level security

Policies exist on `profiles`. They apply only inside `withUser`.

- Policies and helpers are hand-written SQL in `packages/database/migrations`, committed with the table they protect. Drizzle does not generate them.
- Application authorization stays in `packages/domain`. `changeRole` decides whether a role assignment is allowed.
- Database authorization is row level security. It still applies to a query the application did not intend, once that query runs as `apex_app`.
- `getDatabase()` is the owner pool. It bypasses those policies. Migrations, seeds, and the future first-login insert use it. It never ships to the browser.
- `withUser` is the user-scoped path. It does not read cookies or headers. Policies call `app.current_user_id()`, not `auth.uid()`.
- `apex_app` cannot insert or delete profiles. Profile creation is a trusted owner path in the login slice.

Application checks and row level security both exist. One does not replace the other. A policy on the owner connection would not protect a request.

## Supabase

Supabase provides hosted Postgres and, later, Auth. This phase uses the Postgres connection string only. PostgREST, the Supabase JavaScript client, Storage, and Auth are not wired.

Another Postgres host can replace Supabase by changing `DATABASE_URL` and `DIRECT_URL`. There is no provider interface in front of Drizzle.

## Testing

`packages/database` unit tests cover env parsing and uuid checks for `withUser`. They do not open a connection. Domain tests stay database-free.

The profiles integration test talks to PostgreSQL when `DATABASE_URL` is set and skips otherwise. CI has no database URL, so that test stays skipped. It is not pointed at production.
