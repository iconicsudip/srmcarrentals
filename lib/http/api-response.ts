import { NextResponse } from "next/server";
import type { PaginatedResult, PaginationMeta } from "@srm/types";

export function ok<T>(data: T, init?: number | ResponseInit): NextResponse {
  return NextResponse.json(data, typeof init === "number" ? { status: init } : init);
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json(data, { status: 201 });
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function paginated<T>(data: T[], meta: PaginationMeta): NextResponse {
  const body: PaginatedResult<T> = { data, meta };
  return NextResponse.json(body);
}
