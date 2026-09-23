import { parseRole, type Profile } from "@apex/domain";
import type { InferSelectModel } from "drizzle-orm";
import { profiles } from "./schema/profiles";

export type ProfileRow = InferSelectModel<typeof profiles>;

export function toProfile(row: ProfileRow): Profile {
  const role = parseRole(row.role);
  if (!role) {
    throw new Error("profiles.role is not a known role");
  }

  return {
    id: row.id,
    role,
    displayName: row.displayName,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
