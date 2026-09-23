import { z } from "zod";
import { generateSlug } from "@srm/utils";

const statusSchema = z.enum(["ACTIVE", "INACTIVE"]).optional();

/** Schema builder for "named" lookups: { name, slug, status, ...extra }.
 * `slug` is auto-derived from `name` when omitted. */
export function namedLookupSchema<T extends z.ZodRawShape>(extra?: T) {
  const base = z.object({
    name: z.string().min(1).max(120),
    slug: z.string().min(1).max(140).optional(),
    status: statusSchema,
    ...(extra ?? {}),
  });

  const createSchema = base.transform((data) => ({
    ...data,
    slug: data.slug?.trim() || generateSlug(data.name),
  }));

  const updateSchema = base.partial();

  return { createSchema, updateSchema };
}

/** Schema builder for "count" lookups: { count, label?, status }. */
export function countLookupSchema() {
  const base = z.object({
    count: z.coerce.number().int().positive(),
    label: z.string().max(60).optional(),
    status: statusSchema,
  });

  return { createSchema: base, updateSchema: base.partial() };
}

/** Schema builder for plain { name, status, ...extra } lookups with no slug
 * (Colors, Features, Safety Features, Steering/Fuel/Transmission Types). */
export function nameStatusSchema<T extends z.ZodRawShape>(extra?: T) {
  const base = z.object({
    name: z.string().min(1).max(120),
    status: statusSchema,
    ...(extra ?? {}),
  });

  return { createSchema: base, updateSchema: base.partial() };
}
