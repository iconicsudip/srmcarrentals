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

const FALLBACK_PAGES: Record<string, { title: string; slug: string; content: string }> = {
  "privacy-policy": {
    title: "Privacy Policy",
    slug: "privacy-policy",
    content: `At SRM Car Rentals, accessible from our website, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by SRM Car Rentals and how we use it.

If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.

Information We Collect:
When you register for an Account or book a vehicle, we may ask for your contact information, including items such as name, company name, address, email address, telephone number, and driving license details for verification.

How We Use Your Information:
We use the information we collect in various ways, including to:
• Provide, operate, and maintain our car rental services
• Improve, personalize, and expand our offerings
• Understand and analyze how you use our website
• Communicate with you, either directly or through our customer service team, for customer support, updates, and booking confirmations
• Send you booking updates, digital invoices, and KYC verification notices
• Prevent fraudulent transactions and protect vehicle security

Security of Your Data:
We value your trust in providing us your Personal Information, thus we strive to use commercially acceptable means of protecting it. No method of transmission over the internet, or method of electronic storage is 100% secure, but we implement industry-standard 256-bit encryption.`,
  },
};

export async function getPublishedPageBySlug(slug: string) {
  try {
    const page = await prisma.page.findUnique({ where: { slug, status: "PUBLISHED" } });
    if (page) return page;
    return FALLBACK_PAGES[slug] ?? null;
  } catch (err) {
    console.warn(`[getPublishedPageBySlug] DB unavailable for slug "${slug}":`, (err as Error).message);
    return FALLBACK_PAGES[slug] ?? null;
  }
}
