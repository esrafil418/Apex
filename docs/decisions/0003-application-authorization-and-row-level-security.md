# 0003. Application authorization and row level security

## Status

Accepted

## Context

Apex will authenticate users with Supabase Auth in a later slice. This slice needs an authorization kernel first: roles, a profile row, a rule for changing roles, and a Postgres path where policies actually run.

`getDatabase()` connects as the database owner. That role bypasses row level security. A policy attached to `profiles` does nothing for a query on that pool. Treating the owner connection as "the request's user" would look like protection in a review and would not protect a request.

Supabase Auth stores email and the user id. Local Postgres, and any other host that is only a connection-string change, has no `auth` schema. A foreign key from `profiles.id` to `auth.users` would fail there and would lock the catalog to Supabase.

A client can send a role claim. That claim is not a source of truth.

## Decision

Authorization has two layers.

Application checks live in `packages/domain`. `changeRole` decides whether this actor may assign that role. It returns a result object. It does not throw for those rejections. The last admin cannot be demoted. The actor cannot change their own role. Only an admin may assign a role. A client-supplied role is ignored: a new profile is `customer` unless a trusted server path writes otherwise.

Database authorization is row level security on `profiles`. Policies apply only inside `withUser`. That helper opens a transaction on the owner pool, sets `app.user_id` with `set_config(..., true)` so the value is transaction-local, then `SET LOCAL ROLE apex_app`. `apex_app` is `NOLOGIN` and does not have `BYPASSRLS`. A policy on the owner connection would not protect a request, because the owner never becomes `apex_app`.

Policies read `app.current_user_id()`, not `auth.uid()`. Identity is the uuid the server already verified. When login exists, that uuid is the Supabase Auth user id. The helper does not read cookies, headers, or a role from the client.

`profiles.id` is a uuid primary key with no foreign key to `auth.users`. The login slice will insert the profile with that same id on a trusted owner path. `apex_app` has no insert or delete policy. Email and passwords stay in the auth provider.

`role` is text with a check constraint for `customer`, `admin`, `manager`, `editor`, `support`, and `analyst`. Adding a role is a new migration. One role per user is enough. A join table can wait until a person genuinely needs two roles at once.

The last-admin count stays in the domain. The policy only requires the actor to be an admin and refuses an update of the actor's own row. Duplicating the count in SQL would be a second, looser copy of the same rule.

## Alternatives considered

### Calling `auth.uid()` in policies

Supabase documents that pattern for PostgREST. This app does not query through PostgREST. `auth.uid()` is empty on a Drizzle session unless the session is built as a Supabase JWT login, which this helper does not do. `app.current_user_id()` works on hosted Supabase and on local Postgres.

### Foreign key to `auth.users`

It would keep orphan profiles from existing on Supabase. It would break `pnpm db:migrate` against local Postgres and against any host that is not Supabase. 0002 already says replacing the host is a connection-string change.

### A Postgres enum for role

`ALTER TYPE ... ADD VALUE` is awkward in transaction migrations. A check constraint plus a new migration is enough for six roles.

### Multiple roles in a join table

Useful when one person is both support and editor. No current feature needs that. One column keeps `changeRole` and the policies small.

### Trusting a role claim on the JWT

The token is client-visible. A role in the token can be stale or forged if verification is skipped. The role that matters is the row in `profiles`.

### Enforcing RLS by connecting the whole app as `apex_app`

Migrations, seeds, first-login inserts, and trusted jobs need the owner. Connecting the pool as `apex_app` would apply policies to those jobs and would still need a way to set `app.user_id` on every request. The split is: owner pool for trusted work, `withUser` for user-scoped work.

## Consequences

- A reviewer who asks "does RLS protect this query?" must ask "did this query run inside `withUser`?" If it ran on `getDatabase()` alone, the answer is no.
- Login, OAuth, cookies, and session refresh are the next slice. They may verify a user id and then call `withUser`. They may insert a profile as the owner. They must not send a client role into `profiles.role`.
- `FORCE ROW LEVEL SECURITY` is off. The owner bypass is intentional and tested.
- Policies and helpers are hand-written SQL in `packages/database/migrations`, next to the table they protect.
