"use client";

import { CarPricingManager } from "@/components/admin/pricing/car-pricing-manager";

export default function HourlyPricingPage() {
  return (
    <CarPricingManager
      title="Hourly Pricing"
      description="The pure hourly rate used for rentals under 24 hours (leave blank to disable hourly mode for a car)."
    />
  );
}
