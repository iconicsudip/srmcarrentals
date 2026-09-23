"use client";

import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface CustomerRow extends LookupRow {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  totalBookings: number;
  totalSpent: string;
  accountStatus: "ACTIVE" | "SUSPENDED" | "BANNED";
}

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: z.string().min(1, "Last name is required").max(80),
  email: z.string().email(),
  phone: z.string().min(1, "Phone is required"),
  accountStatus: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]),
});

const STATUS_VARIANT = { ACTIVE: "success", SUSPENDED: "warning", BANNED: "destructive" } as const;

export default function CustomersPage() {
  return (
    <LookupManager<CustomerRow>
      title="Customers"
      description="Every customer who has registered or booked with you."
      basePath="/customers"
      queryKey={["customers"]}
      entityLabel="customer"
      searchPlaceholder="Search by name, email, or phone..."
      hasStatus={false}
      formSchema={formSchema}
      createDefaultValues={{ accountStatus: "ACTIVE" }}
      fields={[
        { name: "firstName", label: "First Name" },
        { name: "lastName", label: "Last Name" },
        { name: "email", label: "Email" },
        { name: "phone", label: "Phone" },
        {
          name: "accountStatus",
          label: "Account Status",
          type: "select",
          selectOptions: [
            { label: "Active", value: "ACTIVE" },
            { label: "Suspended", value: "SUSPENDED" },
            { label: "Banned", value: "BANNED" },
          ],
        },
      ]}
      columns={[
        {
          header: "Customer",
          cell: (row) => (
            <div>
              <div className="font-medium">
                {row.firstName} {row.lastName}
              </div>
              <div className="text-muted-foreground text-xs">{row.email}</div>
            </div>
          ),
        },
        { header: "Phone", cell: (row) => row.phone },
        { header: "Bookings", cell: (row) => row.totalBookings },
        { header: "Total Spent", cell: (row) => `₹${Number(row.totalSpent).toLocaleString("en-IN")}` },
        { header: "Status", cell: (row) => <Badge variant={STATUS_VARIANT[row.accountStatus]}>{row.accountStatus}</Badge> },
      ]}
    />
  );
}
