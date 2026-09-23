# 0002. Drizzle owns Postgres access

## Status

Accepted

## Context

Apex stores commerce data in PostgreSQL hosted by Supabase. The Next.js app is the only application runtime. `packages/database` already owns SQL, schema, and the database client, and `packages/domain` must stay free of provider types.

The database layer has to serve checkout, inventory, and other multi-statement operations. Those need real transactions, constraints, and readable SQL. Supabase also supplies Auth later, and row level security will sit on the same tables. Migrations have to be reviewable SQL that can run in CI and in production.

## Decision

Use Drizzle ORM with the `postgres` driver (postgres.js).

- Table definitions live in `packages/database/src/schema`.
- `drizzle-kit generate` writes SQL migrations into `packages/database/migrations`. Those files are the migration history.
- `drizzle-kit migrate` applies that history.
- The application runtime connects with `DATABASE_URL`.
- Migration commands connect with `DIRECT_URL`, or with `DATABASE_URL` when `DIRECT_URL` is unset.
- Prepared statements are disabled so the Supabase transaction pooler (port 6543) can serve the runtime connection.
- Supabase is the hosted Postgres provider. The app does not query through PostgREST or `supabase-js`.
- `@apex/database` imports `server-only`. Server code reaches it through `apps/web/server/db.ts`.

`profiles` is the first table. Domain types are not Drizzle row types. Mapping happens in `packages/database/src/profile.ts`.

## Alternatives considered

### Prisma

Prisma generates a client from its own schema language and produces SQL migrations. The client is convenient, and migrations are a solved workflow. Postgres-specific objects such as partial indexes, exclusion constraints, and row level security policies sit outside the schema language and become manual SQL anyway. The generated client is also easy to pass into domain code. That is a poor fit for a commerce model that will lean on Postgres constraints and on policies stored as SQL.

### Kysely

Kysely is a typed SQL builder with little runtime of its own. Queries stay close to SQL. The schema types are generated from a live database or written by hand, so the source of truth is split between SQL files and a type generator. Migrations need a second tool. Apex would be assembling the same stack Drizzle already joins: schema, SQL migrations, and a typed query API.

### Supabase client as the query layer

`supabase-js` speaks to PostgREST. Row level security applies naturally to those requests. Multi-statement transactions, row locks, and checkout flows do not. A service-role client on the server would also bypass those policies while hiding the SQL. Commerce writes belong on a Postgres session, not on a REST resource.

### SQL files and `node-postgres` without a query layer

Hand-written SQL gives full control. Every query then needs its own types, and a migration runner still has to be chosen. The typecheck of a query would depend on discipline rather than the schema module. That cost is not justified before the first table exists, and it remains unattractive once many tables exist.

## Trade-offs

Drizzle's schema is TypeScript, so the database package depends on Drizzle. Domain code does not. Developers read generated SQL in review; they do not treat the TypeScript schema as a substitute for the migration file.

The runtime connection disables prepared statements. That is required for Supabase transaction pooling and is slightly less efficient on a direct session. A long-lived server pointed at a direct URL can enable them later without changing the schema.

The current connection uses the database owner role. On Supabase that role bypasses row level security unless a table is created with `FORCE ROW LEVEL SECURITY`. Application code must not treat today's client as user-scoped.

`drizzle-kit check` and `generate` need a URL field even when they do not connect. With no env file they receive a localhost placeholder. `db:migrate`, `db:ping`, and `db:seed` reject a missing `DATABASE_URL` before they connect.

## Consequences

- The first persisted feature adds tables under `packages/database/src/schema`, generates a migration, and maps rows to domain types at the database boundary.
- Checkout, inventory, and other concurrent writes use `database.transaction()` on this client, plus Postgres constraints and row locks. There is no transaction wrapper.
- Row level security policies will be SQL in `packages/database/migrations`, committed with the table they protect.
- User-scoped identity enters `withUser`, which sets `app.user_id` and `SET LOCAL ROLE apex_app`. See [0003](0003-application-authorization-and-row-level-security.md).
- The owner connection stays server-only and is reserved for trusted server work.
- Replacing Supabase with another Postgres host means changing connection strings and the future auth provider. Queries stay Drizzle SQL against Postgres.
- `supabase-js` is not a dependency. It arrives with Auth or Storage, if those features need the Supabase APIs.
