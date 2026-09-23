# Authorization

Authentication proves who the caller is. Authorization decides what that person may do. This slice implements authorization. There is no session, no login page, and no OAuth.

## Two layers

`changeRole` in `packages/domain` is the application check. It runs in process, before a write. It knows the last-admin count. It does not open a database connection.

Row level security on `profiles` is the database check. It runs only after `withUser` sets `app.user_id` and `SET LOCAL ROLE apex_app`. A query on `getDatabase()` uses the owner role and bypasses those policies. Migrations, seeds, and the future first-login insert use the owner on purpose.

A policy on the owner connection would not protect a request.

## Matrix for this slice

| Action | customer | editor | manager | support | analyst | admin |
| --- | --- | --- | --- | --- | --- | --- |
| Read own profile | yes | yes | yes | yes | yes | yes |
| Read any profile | no | no | yes | yes | yes | yes |
| Edit own display name | yes | yes | yes | yes | yes | yes |
| Edit another display name | no | no | no | no | no | no |
| Assign a role | no | no | no | no | no | yes, not self, not the last admin |

A new profile is stored as `customer`. The client cannot choose a role on insert. Profile creation is a trusted owner path in the login slice. `apex_app` has no insert or delete policy.

## Request path

1. A later slice verifies the user id. This slice does not read cookies or headers.
2. For a role change, the server loads the actor, the target, and the admin count, then calls `changeRole`. A rejection stops there.
3. User-scoped SQL runs inside `withUser(userId, fn)`. The helper validates the id as a uuid, then binds it to `set_config`. The role name is the constant `apex_app`.
4. Policies read `app.current_user_id()`. They do not call `auth.uid()`.

There is no page that calls `withUser` yet.

## Roles

One role per profile: `customer`, `admin`, `manager`, `editor`, `support`, `analyst`. Stored lowercase. `parseRole` rejects `ADMIN`.

## Next slice

Login, OAuth, cookies, and session refresh. That slice may attach a verified user id and insert the first profile. It must not replace `changeRole` or connect the owner pool as if it were the user.
