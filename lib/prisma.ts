import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

/** Singleton Prisma client. Next.js hot-reloads modules in dev, which would
 * otherwise spawn a fresh PrismaClient (and DB connection pool) per reload —
 * stash it on `global` to survive HMR. */
export const prisma: PrismaClient =
  global.__prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma__ = prisma;
}
