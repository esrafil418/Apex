export const ROLES = ["customer", "admin", "manager", "editor", "support", "analyst"] as const;

export type Role = (typeof ROLES)[number];

export function parseRole(value: string): Role | undefined {
  return (ROLES as readonly string[]).includes(value) ? (value as Role) : undefined;
}
