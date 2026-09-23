import type { Role } from "./role";

export type Profile = {
  id: string;
  role: Role;
  displayName: string;
  createdAt: Date;
  updatedAt: Date;
};
