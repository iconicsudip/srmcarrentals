import type { PaginationMeta } from "@srm/types";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Parse `?page=&limit=` from a request URL into Prisma skip/take. */
export function parsePagination(url: string | URL): PaginationParams {
  const searchParams = typeof url === "string" ? new URL(url).searchParams : url.searchParams;

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get("limit")) || DEFAULT_LIMIT));

  return { page, limit, skip: (page - 1) * limit, take: limit };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
