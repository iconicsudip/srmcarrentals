import { z } from "zod";

import { createLookupCrud } from "@/lib/http/lookup-crud";
import { prisma } from "@/lib/prisma";
import { namedLookupSchema } from "@/modules/car-attributes/lookup.schemas";

const { createSchema, updateSchema } = namedLookupSchema({
  /** CITY = city entry (managed on the Cities page), POINT = pickup / drop location inside a city. */
  kind: z.enum(["CITY", "POINT"]).optional(),
  city: z.string().min(1).max(120),
  state: z.string().min(1).max(120),
  country: z.string().min(1).max(120),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  serviceRadiusKm: z.coerce.number().positive().optional(),
  dropCharge: z.coerce.number().nonnegative().optional().default(0),
});

export const locationsCrud = createLookupCrud({
  delegate: prisma.location,
  createSchema,
  updateSchema,
  searchFields: ["name", "city", "state"],
  orderBy: { name: "asc" },
  buildWhere: (url) => {
    const kind = url.searchParams.get("kind");
    return kind === "CITY" || kind === "POINT" ? { kind } : {};
  },
  notFoundMessage: "Location not found",
});

/** Fills in what the form leaves out: a city entry's `city` is its own name; a pickup point inherits state / country from its city. */
async function normalize(req: Request): Promise<Request> {
  const body = (await req.json()) as Record<string, unknown>;
  if (body.kind === "CITY" && body.name && !body.city) body.city = body.name;
  if (body.kind !== "CITY" && typeof body.city === "string" && (!body.state || !body.country)) {
    const city = await prisma.location.findFirst({
      where: { kind: "CITY", city: { equals: body.city, mode: "insensitive" } },
      select: { state: true, country: true },
    });
    if (city) {
      body.state ??= city.state;
      body.country ??= city.country;
    }
  }
  return new Request(req.url, { method: req.method, headers: req.headers, body: JSON.stringify(body) });
}

export const createLocation = async (req: Request) => locationsCrud.create(await normalize(req));
export const updateLocation = async (req: Request, id: string) => locationsCrud.update(await normalize(req), id);
