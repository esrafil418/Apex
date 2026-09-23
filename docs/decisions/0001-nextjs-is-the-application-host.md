# 0001. Next.js is the application host

## Status

Accepted

## Context

Apex needs one place to serve the storefront and handle HTTP. A second backend process would split deployment, authentication, and validation before any feature requires an independent service.

## Decision

`apps/web` is the only application runtime. It owns routing, server rendering, and request handlers. Business rules live in `packages/domain` and use cases live in `packages/application`. Those packages do not import Next.js.

PostgreSQL is reached through Supabase later, from `packages/database` and `packages/infrastructure`, behind the application boundary.

## Consequences

Server-side validation and authorization run in Next.js server code and call application use cases. A separate backend waits until a feature cannot run inside the Next.js server runtime.
