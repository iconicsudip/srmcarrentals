import type { z } from "zod";

import { NotFoundError } from "@/lib/http/errors";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";

/** Minimal shape every Prisma model delegate satisfies — enough to build a
 * generic CRUD layer without depending on Prisma's per-model generated
 * types (which differ per model and would defeat genericization).
 *
 * NOTE: these are declared with method-shorthand syntax (not arrow-function
 * properties) so TypeScript checks their parameters bivariantly — that's
 * what lets Prisma's much more specific per-model delegate types (e.g.
 * `CarBrandDelegate`, whose `findMany` only accepts `CarBrandFindManyArgs`)
 * satisfy this looser structural shape. */
interface LookupDelegate {
  findMany(args: any): Promise<any[]>;
  count(args: any): Promise<number>;
  create(args: any): Promise<any>;
  update(args: any): Promise<any>;
  delete(args: any): Promise<any>;
  findUnique(args: any): Promise<any | null>;
}

interface LookupCrudOptions<TCreate, TUpdate> {
  delegate: LookupDelegate;
  createSchema: z.ZodType<TCreate>;
  updateSchema: z.ZodType<TUpdate>;
  /** String fields matched with a case-insensitive `contains` against `?search=`. */
  searchFields?: string[];
  orderBy?: Record<string, "asc" | "desc">;
  include?: Record<string, unknown>;
  /** Extra `where` clauses derived from query params, e.g. `?brandId=` on Models. */
  buildWhere?: (url: URL) => Record<string, unknown>;
  notFoundMessage?: string;
}

/**
 * Factory for the ~14 simple "lookup" entities behind Car Rental > Brands,
 * Models, Colors, Seats, Cylinders, Doors, Features, Safety Features,
 * Categories, Types, Capacity, Steering/Fuel/Transmission Types — every one
 * of which is Create/Edit/Delete/Search/Paginate/Status-toggle over a flat
 * table. Keeps that logic in one place instead of duplicated 14 times.
 */
export function createLookupCrud<TCreate, TUpdate>(options: LookupCrudOptions<TCreate, TUpdate>) {
  async function list(req: Request) {
    const url = new URL(req.url);
    const { page, limit, skip, take } = parsePagination(url);
    const search = url.searchParams.get("search")?.trim();
    const status = url.searchParams.get("status");

    const where: Record<string, unknown> = { ...options.buildWhere?.(url) };

    if (search && options.searchFields?.length) {
      where.OR = options.searchFields.map((field) => ({
        [field]: { contains: search, mode: "insensitive" },
      }));
    }
    if (status === "ACTIVE" || status === "INACTIVE") {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      options.delegate.findMany({
        where,
        orderBy: options.orderBy ?? { createdAt: "desc" },
        skip,
        take,
        include: options.include,
      }),
      options.delegate.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(page, limit, total) };
  }

  async function create(req: Request) {
    const body = options.createSchema.parse(await req.json());
    return options.delegate.create({ data: body, include: options.include });
  }

  async function getOrThrow(id: string) {
    const existing = await options.delegate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError(options.notFoundMessage ?? "Record not found");
    return existing;
  }

  async function update(req: Request, id: string) {
    await getOrThrow(id);
    const body = options.updateSchema.parse(await req.json());
    return options.delegate.update({ where: { id }, data: body, include: options.include });
  }

  async function remove(id: string) {
    await getOrThrow(id);
    await options.delegate.delete({ where: { id } });
  }

  return { list, create, update, remove, getOrThrow };
}
