import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { createBookingSchema } from "@/modules/bookings/bookings.schemas";
import { createBooking, listBookings } from "@/modules/bookings/bookings.service";

/**
 * @swagger
 * /bookings:
 *   get:
 *     tags: [Bookings]
 *     summary: List bookings (admin — paginated, filterable by status/search/car/customer)
 *     responses: { 200: { description: Paginated bookings. } }
 *   post:
 *     tags: [Bookings]
 *     summary: Create a booking (public — used by the customer booking flow). Creates a 15-minute "Temporary Hold" that auto-releases via BullMQ if not confirmed.
 *     responses:
 *       201: { description: Created booking with its immutable pricing snapshot. }
 *       409: { description: The car is not available for the requested dates. }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("bookings.view");
  const url = new URL(req.url);
  const { data, meta } = await listBookings(req, {
    status: url.searchParams.get("status") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    carId: url.searchParams.get("carId") ?? undefined,
    customerId: url.searchParams.get("customerId") ?? undefined,
  });
  return paginated(data, meta);
});

export const POST = withErrorHandling(async (req) => {
  const body = createBookingSchema.parse(await req.json());
  return created(await createBooking(body));
});
