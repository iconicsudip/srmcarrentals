import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { pricingCalculateSchema } from "@/modules/pricing/dto/pricing-calculate.dto";
import { calculatePricing } from "@/modules/pricing/pricing.service";

/**
 * @swagger
 * /pricing/calculate:
 *   post:
 *     tags: [Pricing]
 *     summary: Authoritative price calculation for a prospective booking (public — used by the booking flow before login)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [carId, pickupDateTime, dropDateTime]
 *             properties:
 *               carId: { type: string }
 *               pickupDateTime: { type: string, format: date-time }
 *               dropDateTime: { type: string, format: date-time }
 *               pickupLocationId: { type: string }
 *               dropLocationId: { type: string }
 *               pickupIsAirport: { type: boolean }
 *               dropIsAirport: { type: boolean }
 *               pickupAirportId: { type: string }
 *               dropAirportId: { type: string }
 *               estimatedKm: { type: number }
 *               rentalPackageId: { type: string }
 *               extraServiceIds: { type: array, items: { type: string } }
 *               insuranceId: { type: string }
 *               couponCode: { type: string }
 *     responses:
 *       200: { description: Full price breakdown (see PricingCalculateResponse). }
 *       400: { description: Invalid request, or car has no pricing configured. }
 *       404: { description: Car / location / package / insurance not found. }
 */
export const POST = withErrorHandling(async (req) => {
  const body = pricingCalculateSchema.parse(await req.json());
  return ok(await calculatePricing(body));
});
