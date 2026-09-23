"use client";

import { UsersManager } from "@/components/admin/users/users-manager";

export default function StaffPage() {
  return (
    <UsersManager
      title="Staff"
      description="Booking Managers and Staff with limited, operational dashboard access."
      roleNames={["BOOKING_MANAGER", "STAFF"]}
      entityLabel="Staff Member"
    />
  );
}
