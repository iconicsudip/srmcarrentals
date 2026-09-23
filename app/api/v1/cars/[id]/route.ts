import { requirePermission } from "@/lib/auth/rbac";
import { noContent, ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { updateCarSchema } from "@/modules/cars/cars.schemas";
import { deleteCar, getCarById, updateCar } from "@/modules/cars/cars.service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * @swagger
 * /cars/{id}:
 *   get: { tags: [Cars], summary: Get a car by id, responses: { 200: { description: Car. } } }
 *   patch: { tags: [Cars], summary: Update a car, responses: { 200: { description: Updated. } } }
 *   delete: { tags: [Cars], summary: Delete a car, responses: { 204: { description: Deleted. } } }
 */
export const GET = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("cars.view");
  const { id } = await params;
  return ok(await getCarById(id));
});

export const PATCH = withErrorHandling<Ctx>(async (req, { params }) => {
  await requirePermission("cars.edit");
  const { id } = await params;
  const body = updateCarSchema.parse(await req.json());
  return ok(await updateCar(id, body));
});

export const DELETE = withErrorHandling<Ctx>(async (_req, { params }) => {
  await requirePermission("cars.delete");
  const { id } = await params;
  await deleteCar(id);
  return noContent();
});
