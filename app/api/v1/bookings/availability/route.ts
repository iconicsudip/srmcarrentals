import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { isCarAvailable } from "@/modules/bookings/availability.service";

const schema = z.object({
  carId: z.string().min(1),
  pickupDateTime: z.coerce.date(),
  dropDateTime: z.coerce.date(),
});

/**
 * @swagger
 * /bookings/availability:
 *   get:
 *     tags: [Bookings]
 *     summary: Check whether a car is free for a date range (public — used before creating a booking hold)
 *     parameters:
 *       - in: query
 *         name: carId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: pickupDateTime
 *         required: true
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: dropDateTime
 *         required: true
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200: { description: "{ available: boolean }" }
 */
export const GET = withErrorHandling(async (req) => {
  const url = new URL(req.url);
  const { carId, pickupDateTime, dropDateTime } = schema.parse({
    carId: url.searchParams.get("carId"),
    pickupDateTime: url.searchParams.get("pickupDateTime"),
    dropDateTime: url.searchParams.get("dropDateTime"),
  });

  const available = await isCarAvailable(prisma, carId, pickupDateTime, dropDateTime);
  return ok({ available });
});
