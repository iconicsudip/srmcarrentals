"use client";

import { CarPricingManager } from "@/components/admin/pricing/car-pricing-manager";

export default function ExtraHourChargesPage() {
  return (
    <CarPricingManager
      title="Extra Hour Charges"
      description="Per-hour charge applied past the grace period when a car is returned late — and the grace period / rounding mode that govern it."
    />
  );
}
