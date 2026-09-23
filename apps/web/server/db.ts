/**
 * Server entry for database access. Import this from server components,
 * route handlers, and server actions. The package entry loads server-only,
 * so a client component cannot import it.
 */
export { closeDatabase, getDatabase, pingDatabase, withUser } from "@apex/database";
