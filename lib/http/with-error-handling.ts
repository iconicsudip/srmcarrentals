import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { ApiHttpException } from "@/lib/http/errors";

type RouteHandler<Ctx = unknown> = (req: Request, ctx: Ctx) => Promise<Response>;

/** Wraps a Route Handler with centralized error handling — the Next.js
 * equivalent of a NestJS global exception filter. Keeps every route handler
 * a thin controller: business logic throws typed errors, this is the only
 * place that turns them into HTTP responses. */
export function withErrorHandling<Ctx = unknown>(handler: RouteHandler<Ctx>): RouteHandler<Ctx> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return toErrorResponse(error, req);
    }
  };
}

function toErrorResponse(error: unknown, req: Request): NextResponse {
  const timestamp = new Date().toISOString();
  const path = new URL(req.url).pathname;

  if (error instanceof ApiHttpException) {
    return NextResponse.json(
      { statusCode: error.statusCode, message: error.message, error: error.error, path, timestamp },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        statusCode: 400,
        error: "Bad Request",
        message: error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
        path,
        timestamp,
      },
      { status: 400 },
    );
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return NextResponse.json(
        { statusCode: 409, error: "Conflict", message: `A record with this ${target} already exists`, path, timestamp },
        { status: 409 },
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { statusCode: 404, error: "Not Found", message: "Record not found", path, timestamp },
        { status: 404 },
      );
    }
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          statusCode: 409,
          error: "Conflict",
          message: "This record is referenced by other records and cannot be modified",
          path,
          timestamp,
        },
        { status: 409 },
      );
    }
  }

  // eslint-disable-next-line no-console
  console.error(`[unhandled-error] ${path}`, error);

  return NextResponse.json(
    { statusCode: 500, error: "Internal Server Error", message: "Something went wrong", path, timestamp },
    { status: 500 },
  );
}
