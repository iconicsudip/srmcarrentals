"use client";

import { UsersManager } from "@/components/admin/users/users-manager";

export default function AdminUsersPage() {
  return (
    <UsersManager
      title="Admin Users"
      description="Users with Super Admin or Admin access to this dashboard."
      roleNames={["SUPER_ADMIN", "ADMIN"]}
      entityLabel="Admin"
    />
  );
}
