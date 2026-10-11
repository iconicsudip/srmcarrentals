import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { revalidatePath, revalidateTag } from "next/cache";

import { getSession } from "@/lib/auth/session";
import { ApiHttpException } from "@/lib/http/errors";

type RouteHandler<Ctx = unknown> = (req: Request, ctx: Ctx) => Promise<Response>;

/** Wraps a Route Handler with centralized error handling — the Next.js
 * equivalent of a NestJS global exception filter. Keeps every route handler
 * a thin controller: business logic throws typed errors, this is the only
 * place that turns them into HTTP responses. */
export function withErrorHandling<Ctx = unknown>(handler: RouteHandler<Ctx>): RouteHandler<Ctx> {
  return async (req, ctx) => {
    try {
      const res = await handler(req, ctx);
      if (res.status < 400) await refreshPublicSiteAfterAdminEdit(req);
      return res;
    } catch (error) {
      return toErrorResponse(error, req);
    }
  };
}

/** Endpoints whose writes never change what the public website shows. */
const NO_PUBLIC_EFFECT = /\/api\/v1\/(auth|bookings|payments|finance|uploads|notifications|pricing\/calculate|car-enquiries|taxi-enquiries|analytics|integrations)(\/|$)/;

/**
 * When a staff member saves something (content, cars, prices…), drop the website's cached pages/data so
 * the change shows immediately instead of after the cache window.
 */
async function refreshPublicSiteAfterAdminEdit(req: Request): Promise<void> {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return;
  try {
    if (NO_PUBLIC_EFFECT.test(new URL(req.url).pathname)) return;
    const session = await getSession();
    if (!session || session.role === "CUSTOMER") return;
    revalidateTag("public-content", { expire: 0 });
    revalidatePath("/", "layout");
  } catch {
    /* never let cache refresh break a save */
  }
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
