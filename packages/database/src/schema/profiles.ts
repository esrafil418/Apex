import { sql } from "drizzle-orm";
import { check, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey(),
    role: text("role").notNull().default("customer"),
    displayName: text("display_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "profiles_role_known",
      sql`${table.role} in ('customer', 'admin', 'manager', 'editor', 'support', 'analyst')`,
    ),
  ],
);
