"use client";

import { UsersManager } from "@/components/admin/users/users-manager";

export default function StaffPage() {
  return (
    <UsersManager
      title="Staff"
      description="Everyone with a limited dashboard role: Booking Managers, Staff and any role you create. Give each person a role, and optionally limit them to certain locations."
      excludeRoleNames={["SUPER_ADMIN", "ADMIN", "CUSTOMER", "DRIVER"]}
      entityLabel="Staff Member"
    />
  );
}
