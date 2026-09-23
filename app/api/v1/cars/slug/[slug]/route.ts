import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { getCarBySlug } from "@/modules/cars/cars.service";

type Ctx = { params: Promise<{ slug: string }> };

/**
 * @swagger
 * /cars/slug/{slug}:
 *   get:
 *     tags: [Cars]
 *     summary: Get a car by its public slug (used by the public website — no auth required)
 *     responses: { 200: { description: Car. } }
 */
export const GET = withErrorHandling<Ctx>(async (_req, { params }) => {
  const { slug } = await params;
  return ok(await getCarBySlug(slug));
});
