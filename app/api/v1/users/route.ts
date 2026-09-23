import { requirePermission } from "@/lib/auth/rbac";
import { created, paginated } from "@/lib/http/api-response";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { createUserSchema } from "@/modules/users/users.schemas";
import { createUser, listUsers } from "@/modules/users/users.service";

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List admin/staff users (paginated, searchable)
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated users. }
 *   post:
 *     tags: [Users]
 *     summary: Create an admin/staff user
 *     responses:
 *       201: { description: User created. }
 */
export const GET = withErrorHandling(async (req) => {
  await requirePermission("users.manage");
  const url = new URL(req.url);
  const pagination = parsePagination(url);
  const search = url.searchParams.get("search") ?? undefined;
  const roles = url.searchParams.get("roles")?.split(",").filter(Boolean);

  const { data, total } = await listUsers(pagination, search, roles);
  return paginated(data, buildPaginationMeta(pagination.page, pagination.limit, total));
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("users.manage");
  const body = createUserSchema.parse(await req.json());
  return created(await createUser(body));
});
