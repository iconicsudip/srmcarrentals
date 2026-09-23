"use client";

import { CarPricingManager } from "@/components/admin/pricing/car-pricing-manager";

export default function ExtraKmChargesPage() {
  return <CarPricingManager title="Extra KM Charges" description="Per-kilometer charge applied once a booking exceeds its included KM allowance." />;
}
