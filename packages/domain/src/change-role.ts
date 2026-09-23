import type { Profile } from "./profile";
import { parseRole, type Role } from "./role";

export type ChangeRoleInput = {
  actor: Profile;
  target: Profile;
  nextRole: string;
  adminCount: number;
};

export type ChangeRoleError = "not_admin" | "self_change" | "last_admin" | "unknown_role";

export type ChangeRoleResult =
  | { ok: true; role: Role }
  | { ok: false; error: ChangeRoleError };

export function changeRole(input: ChangeRoleInput): ChangeRoleResult {
  const nextRole = parseRole(input.nextRole);
  if (!nextRole) {
    return { ok: false, error: "unknown_role" };
  }

  if (input.actor.role !== "admin") {
    return { ok: false, error: "not_admin" };
  }

  if (input.actor.id === input.target.id) {
    return { ok: false, error: "self_change" };
  }

  if (input.target.role === "admin" && input.adminCount === 1 && nextRole !== "admin") {
    return { ok: false, error: "last_admin" };
  }

  return { ok: true, role: nextRole };
}
