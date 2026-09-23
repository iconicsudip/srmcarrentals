"use client";

import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";

interface DriverRow extends LookupRow {
  firstName: string;
  lastName: string;
  phone: string;
  licenseNumber: string;
  licenseExpiry: string;
  driverStatus: "AVAILABLE" | "ON_TRIP" | "OFF_DUTY" | "INACTIVE";
}

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(80),
  lastName: z.string().min(1, "Last name is required").max(80),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email().optional().or(z.literal("")),
  licenseNumber: z.string().min(1, "License number is required"),
  licenseExpiry: z.coerce.date(),
  address: z.string().optional().or(z.literal("")),
  status: z.enum(["AVAILABLE", "ON_TRIP", "OFF_DUTY", "INACTIVE"]),
});

const STATUS_VARIANT = { AVAILABLE: "success", ON_TRIP: "info", OFF_DUTY: "muted", INACTIVE: "destructive" } as const;

export default function DriversPage() {
  return (
    <LookupManager<DriverRow>
      title="Drivers"
      description="Chauffeurs available for driver-assigned bookings."
      basePath="/drivers"
      queryKey={["drivers"]}
      entityLabel="driver"
      searchPlaceholder="Search by name, phone, or license..."
      hasStatus={false}
      formSchema={formSchema}
      createDefaultValues={{ status: "AVAILABLE" }}
      getEditDefaultValues={(row) => ({
        firstName: row.firstName,
        lastName: row.lastName,
        phone: row.phone,
        email: (row as unknown as { email?: string }).email ?? "",
        licenseNumber: row.licenseNumber,
        licenseExpiry: row.licenseExpiry.slice(0, 10),
        address: (row as unknown as { address?: string }).address ?? "",
        status: (row as unknown as { status: string }).status,
      })}
      fields={[
        { name: "firstName", label: "First Name" },
        { name: "lastName", label: "Last Name" },
        { name: "phone", label: "Phone" },
        { name: "email", label: "Email", placeholder: "Optional" },
        { name: "licenseNumber", label: "License Number" },
        { name: "licenseExpiry", label: "License Expiry", type: "date" },
        { name: "address", label: "Address", type: "textarea", placeholder: "Optional" },
        {
          name: "status",
          label: "Status",
          type: "select",
          selectOptions: [
            { label: "Available", value: "AVAILABLE" },
            { label: "On Trip", value: "ON_TRIP" },
            { label: "Off Duty", value: "OFF_DUTY" },
            { label: "Inactive", value: "INACTIVE" },
          ],
        },
      ]}
      columns={[
        {
          header: "Driver",
          cell: (row) => (
            <div>
              <div className="font-medium">
                {row.firstName} {row.lastName}
              </div>
              <div className="text-muted-foreground text-xs">{row.phone}</div>
            </div>
          ),
        },
        { header: "License", cell: (row) => row.licenseNumber },
        { header: "Expiry", cell: (row) => row.licenseExpiry.slice(0, 10) },
        {
          header: "Status",
          cell: (row) => {
            const status = (row as unknown as { status: keyof typeof STATUS_VARIANT }).status;
            return <Badge variant={STATUS_VARIANT[status]}>{status.replace(/_/g, " ")}</Badge>;
          },
        },
      ]}
    />
  );
}
