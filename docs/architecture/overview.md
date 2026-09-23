# Architecture

Apex is a pnpm and Turborepo monorepo. `apps/web` is the only application runtime. Packages hold code that must stay independent of Next.js.

## Dependency direction

```
apps/web  →  application  →  domain
ui        →  (no business packages yet)

infrastructure  →  application, domain
database        →  domain
```

Dependencies point toward the domain. Domain imports none of the other Apex packages.

`types` and `validation` are leaves. They do not depend on domain, application, infrastructure, or the Next.js app. Callers depend on them when a feature needs a shared contract or a schema.

`config` holds TypeScript presets only. Nothing imports it at runtime.

## What stays out of domain

Domain code does not import React, Next.js, Supabase, Prisma, Drizzle, Cloudinary, Stripe, browser APIs, or Node infrastructure.

## Where code goes

| Concern | Home |
| --- | --- |
| Routes, server rendering, HTTP handlers | `apps/web` |
| Use cases | `packages/application` |
| Business rules and domain types | `packages/domain` |
| Provider adapters | `packages/infrastructure` |
| SQL, schema, and database clients | `packages/database` |
| Shared visual components | `packages/ui` |
| Shared non-domain contracts | `packages/types` |
| Input schemas | `packages/validation` |
| Roles, profiles, `changeRole` | `packages/domain` |
| User-scoped SQL (`withUser`, RLS) | `packages/database` |

Server-side validation and authorization stay on the server. Client state is not the source of truth for security-sensitive data.

## Database

`packages/database` holds the Drizzle client, the schema module, SQL migrations, and the seed entry. Supabase hosts Postgres. The app does not query through the Supabase client. Details are in [database.md](database.md). The decision is [0002](../decisions/0002-drizzle-postgresql.md).

`apps/web` reaches the client through `apps/web/server/db.ts`. That entry is server-only. `DATABASE_URL` and `DIRECT_URL` are server environment variables.

Authorization is two layers: domain rules and row level security. Policies apply only inside `withUser`. The owner pool bypasses them. See [authorization.md](authorization.md) and [0003](../decisions/0003-application-authorization-and-row-level-security.md).

## Not abstracted yet

No repository interfaces, event bus, or dependency-injection container. Drizzle is the Postgres library. Supabase Auth, Stripe, and other provider SDKs wait until a feature calls them. Package boundaries are the abstraction.
