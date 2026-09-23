import type { Prisma } from "@prisma/client";
import { generateSlug, makeSlugUnique } from "@srm/utils";

import { prisma } from "@/lib/prisma";
import { NotFoundError } from "@/lib/http/errors";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import type { CreatePageInput, UpdatePageInput } from "@/modules/cms/pages.schemas";

async function uniqueSlug(title: string, providedSlug?: string, excludeId?: string): Promise<string> {
  const base = providedSlug?.trim() || generateSlug(title);
  let attempt = 0;
  let candidate = base;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.page.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!existing || existing.id === excludeId) return candidate;
    attempt += 1;
    candidate = makeSlugUnique(base, attempt);
  }
}

export async function listPages(req: Request) {
  const url = new URL(req.url);
  const { page, limit, skip, take } = parsePagination(url);
  const search = url.searchParams.get("search")?.trim();
  const status = url.searchParams.get("status");

  const where: Prisma.PageWhereInput = {
    ...(search ? { title: { contains: search, mode: "insensitive" as const } } : {}),
    ...(status === "DRAFT" || status === "PUBLISHED" ? { status } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.page.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    prisma.page.count({ where }),
  ]);

  return { data, meta: buildPaginationMeta(page, limit, total) };
}

export async function createPage(input: CreatePageInput) {
  const slug = await uniqueSlug(input.title, input.slug);
  return prisma.page.create({ data: { title: input.title, slug, content: input.content, status: input.status } });
}

export async function updatePage(id: string, input: UpdatePageInput) {
  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Page not found");

  const slug = input.title || input.slug ? await uniqueSlug(input.title ?? existing.title, input.slug, id) : undefined;

  return prisma.page.update({
    where: { id },
    data: { title: input.title, content: input.content, status: input.status, ...(slug ? { slug } : {}) },
  });
}

export async function deletePage(id: string) {
  const existing = await prisma.page.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("Page not found");
  await prisma.page.delete({ where: { id } });
}

export function getPublishedPageBySlug(slug: string) {
  return prisma.page.findUnique({ where: { slug, status: "PUBLISHED" } });
}
