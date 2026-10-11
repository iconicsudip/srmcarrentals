import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";
import { prisma } from "@/lib/prisma";

export const TESTIMONIAL_ORDER = [{ sortOrder: "asc" as const }, { createdAt: "desc" as const }, { id: "asc" as const }];

/** Public: a page of active reviews (the homepage row loads the rest as you scroll). */
export const GET = withErrorHandling(async (req) => {
  const url = new URL(req.url);
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);
  const limit = Math.min(60, Math.max(1, Number(url.searchParams.get("limit")) || 30));
  const rows = await prisma.testimonial.findMany({
    where: { status: "ACTIVE" },
    orderBy: TESTIMONIAL_ORDER,
    skip: offset,
    take: limit,
    select: { id: true, customerName: true, location: true, avatarUrl: true, rating: true, quote: true, bookedItem: true, source: true },
  });
  return ok(rows);
});
