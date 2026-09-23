"use client";

import { z } from "zod";

import { LookupManager, type LookupRow } from "@/components/admin/lookup-manager";
import { Badge } from "@/components/ui/badge";

interface CouponRow extends LookupRow {
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  percentage?: number | string | null;
  fixedAmount?: number | string | null;
  maxDiscount?: number | string | null;
  minBookingAmount?: number | string | null;
  startDate: string;
  endDate: string;
  usageLimit?: number | null;
  usedCount: number;
}

const formSchema = z.object({
  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(30)
    .transform((c) => c.trim().toUpperCase()),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  percentage: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  fixedAmount: z.coerce.number().min(0).optional().or(z.literal("")),
  maxDiscount: z.coerce.number().min(0).optional().or(z.literal("")),
  minBookingAmount: z.coerce.number().min(0).optional().or(z.literal("")),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  usageLimit: z.coerce.number().int().min(1).optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export default function CouponsPage() {
  const today = new Date().toISOString().slice(0, 10);
  const nextYear = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);

  return (
    <LookupManager<CouponRow>
      title="Coupons & Promo Codes"
      description="Manage promotional codes, percentage discounts, flat cashbacks, and usage limits applied during booking."
      basePath="/coupons"
      queryKey={["marketing", "coupons"]}
      entityLabel="coupon"
      searchPlaceholder="Search coupons by code..."
      formSchema={formSchema}
      createDefaultValues={{
        code: "",
        discountType: "PERCENTAGE",
        percentage: 10,
        fixedAmount: "",
        maxDiscount: 1000,
        minBookingAmount: 1500,
        startDate: today,
        endDate: nextYear,
        usageLimit: "",
        status: "ACTIVE",
      }}
      getEditDefaultValues={(row) => ({
        code: row.code,
        discountType: row.discountType,
        percentage: row.percentage ? Number(row.percentage) : "",
        fixedAmount: row.fixedAmount ? Number(row.fixedAmount) : "",
        maxDiscount: row.maxDiscount ? Number(row.maxDiscount) : "",
        minBookingAmount: row.minBookingAmount ? Number(row.minBookingAmount) : "",
        startDate: row.startDate ? new Date(row.startDate).toISOString().slice(0, 10) : today,
        endDate: row.endDate ? new Date(row.endDate).toISOString().slice(0, 10) : nextYear,
        usageLimit: row.usageLimit ?? "",
        status: row.status,
      })}
      fields={[
        { name: "code", label: "Coupon Code", placeholder: "e.g. SRM10" },
        {
          name: "discountType",
          label: "Discount Type",
          type: "select",
          selectOptions: [
            { label: "Percentage (%)", value: "PERCENTAGE" },
            { label: "Fixed Amount (₹)", value: "FIXED" },
          ],
        },
        { name: "percentage", label: "Percentage Discount (%)", type: "number", placeholder: "e.g. 10" },
        { name: "fixedAmount", label: "Fixed Discount Amount (₹)", type: "number", placeholder: "e.g. 500" },
        { name: "maxDiscount", label: "Max Discount Cap (₹)", type: "number", placeholder: "e.g. 1000 (optional)" },
        { name: "minBookingAmount", label: "Min Booking Amount (₹)", type: "number", placeholder: "e.g. 2000 (optional)" },
        { name: "startDate", label: "Start Date", placeholder: "YYYY-MM-DD" },
        { name: "endDate", label: "Expiry Date", placeholder: "YYYY-MM-DD" },
        { name: "usageLimit", label: "Total Usage Limit", type: "number", placeholder: "Leave empty for unlimited" },
      ]}
      columns={[
        {
          header: "Code",
          cell: (row) => (
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold tracking-wider text-orange-400">{row.code}</span>
              {row.status === "ACTIVE" ? (
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-[10px] text-emerald-400">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="border-white/10 text-[10px] text-white/40">
                  Inactive
                </Badge>
              )}
            </div>
          ),
        },
        {
          header: "Discount",
          cell: (row) =>
            row.discountType === "PERCENTAGE"
              ? `${Number(row.percentage)}% OFF ${row.maxDiscount ? `(up to ₹${Number(row.maxDiscount)})` : ""}`
              : `₹${Number(row.fixedAmount)} Flat OFF`,
        },
        {
          header: "Min Booking",
          cell: (row) => (row.minBookingAmount ? `₹${Number(row.minBookingAmount).toLocaleString("en-IN")}` : "No min"),
        },
        {
          header: "Validity",
          cell: (row) => (
            <span className="text-xs text-white/60">
              {new Date(row.startDate).toLocaleDateString("en-IN")} — {new Date(row.endDate).toLocaleDateString("en-IN")}
            </span>
          ),
        },
        {
          header: "Redemptions",
          cell: (row) => (
            <span className="text-xs font-semibold text-white/80">
              {row.usedCount} {row.usageLimit ? `/ ${row.usageLimit}` : "uses"}
            </span>
          ),
        },
      ]}
    />
  );
}
