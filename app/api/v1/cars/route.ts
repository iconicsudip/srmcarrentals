import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { createCarSchema } from "@/modules/cars/cars.schemas";
import { createCar, listCars } from "@/modules/cars/cars.service";

/**
 * @swagger
 * /cars:
 *   get:
 *     tags: [Cars]
 *     summary: List cars (paginated, searchable, filterable)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: brandId
 *         schema: { type: string }
 *       - in: query
 *         name: categoryId
 *         schema: { type: string }
 *       - in: query
 *         name: carTypeId
 *         schema: { type: string }
 *       - in: query
 *         name: isFeatured
 *         schema: { type: boolean }
 *     responses: { 200: { description: Paginated cars. } }
 *   post:
 *     tags: [Cars]
 *     summary: Create a car
 *     responses: { 201: { description: Created. } }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("cars.view");
  const url = new URL(req.url);
  const pagination = parsePagination(url);

  const { data, total } = await listCars(pagination, {
    search: url.searchParams.get("search") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    brandId: url.searchParams.get("brandId") ?? undefined,
    categoryId: url.searchParams.get("categoryId") ?? undefined,
    carTypeId: url.searchParams.get("carTypeId") ?? undefined,
    isFeatured: url.searchParams.has("isFeatured") ? url.searchParams.get("isFeatured") === "true" : undefined,
  });

  return paginated(data, buildPaginationMeta(pagination.page, pagination.limit, total));
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("cars.create");
  const body = createCarSchema.parse(await req.json());
  return created(await createCar(body));
});
