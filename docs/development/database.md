# Database development

Copy [`.env.example`](../../.env.example) to `.env.local` at the repository root and replace the placeholders. Do not commit `.env.local`.

`DATABASE_URL` and `DIRECT_URL` are server-only. Do not create `NEXT_PUBLIC_` copies. Database scripts read the root `.env.local` and `.env` files. The Next.js app loads that same root directory. A variable already set in the shell wins over both files.

For Supabase, use the transaction pooler (port 6543) as `DATABASE_URL` and the direct or session connection (port 5432) as `DIRECT_URL`. For local Postgres, `DATABASE_URL` alone is enough.

## Commands

From the repository root:

| Command | What it does | Needs a database |
| --- | --- | --- |
| `pnpm db:generate` | Writes a SQL migration from `packages/database/src/schema` | No |
| `pnpm db:check` | Fails when the schema and `packages/database/migrations` disagree | No |
| `pnpm db:migrate` | Applies committed migrations with `DIRECT_URL` or `DATABASE_URL` | Yes |
| `pnpm db:ping` | Runs `select 1` | Yes |
| `pnpm db:seed` | Opens one transaction. No fixtures are inserted yet | Yes |
| `pnpm --filter @apex/database test` | Env parser, `withUser` uuid check, and the profiles integration test | Integration test only |
| `pnpm --filter @apex/domain test` | Role and `changeRole` unit tests | No |

`pnpm test` runs those scripts through Turborepo. The profiles integration test skips when `DATABASE_URL` is unset, so CI stays green.

To run the integration test locally, point `DATABASE_URL` at a development Postgres, never a production project. Apply migrations, then run the database tests:

```bash
pnpm db:migrate
pnpm --filter @apex/database test
```

## Adding a table

1. Add the Drizzle table under `packages/database/src/schema`.
2. Run `pnpm db:generate` and review the SQL in `packages/database/migrations`.
3. If the table needs policies, roles, functions, or triggers, create a second migration with `pnpm --filter @apex/database exec drizzle-kit generate --custom --name <name>` and write that SQL by hand. Policies and helpers live in `packages/database/migrations` and are reviewed in the same change as the table they protect.
4. Commit the schema change, the generated table migration, and the hand-written security migration together.
5. Run `pnpm db:migrate` against the development database.
6. Map the row to a domain type inside `packages/database` when the feature reads or writes it.

Do not edit an applied migration. Add a new migration instead. Do not use `drizzle-kit push` as the project history; push skips the migration files. Do not edit a generated table migration after it is correct.

## Reset a development database

Point `DATABASE_URL` and `DIRECT_URL` at the development database, drop and recreate that database, then run `pnpm db:migrate` and `pnpm db:seed`.

Do not run that reset against production. This repository has no reset script, so the drop stays an explicit database operation.

## CI and production

CI runs `pnpm db:check`. It does not connect and it does not apply migrations.

Production applies migrations with `pnpm db:migrate` during deploy, using `DIRECT_URL` from the host secret store, before the release serves traffic. That deploy step is not in `.github/workflows` yet. The production application then uses `DATABASE_URL` for queries.

`next build` and `pnpm typecheck` succeed without a database URL. The client connects on first use inside a server request or a database script.
