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

Server-side validation and authorization stay on the server. Client state is not the source of truth for security-sensitive data.

## Not abstracted yet

No repository interfaces, event bus, dependency-injection container, or provider SDK until a feature needs them. Package boundaries are the abstraction.
