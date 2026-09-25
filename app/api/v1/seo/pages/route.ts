import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";

export interface DiscoverablePage {
  path: string;
  title: string;
  group: "Core Pages" | "Cars" | "Categories" | "Locations" | "Airports" | "Blog" | "CMS Pages" | "Custom URLs";
  entityType?: "HOMEPAGE" | "CAR" | "CAR_CATEGORY" | "LOCATION" | "AIRPORT" | "BLOG_POST" | "PAGE" | "CUSTOM";
  entityId?: string;
  isDynamic: boolean;
  slug?: string;
}

export const GET = withErrorHandling(async () => {
  await requirePermission("seo.manage");

  const [cars, categories, locations, airports, blogs, pages, customPagesSetting] = await Promise.all([
    prisma.car.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.carCategory.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.location.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, city: true, slug: true },
      orderBy: { city: "asc" },
    }),
    prisma.airport.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, code: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.blog.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    }),
    prisma.page.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, title: true, slug: true },
      orderBy: { title: "asc" },
    }),
    prisma.setting.findUnique({
      where: { key: "seo.custom_pages" },
    }),
  ]);

  const corePages: DiscoverablePage[] = [
    { path: "/", title: "Homepage", group: "Core Pages", entityType: "HOMEPAGE", isDynamic: false },
    { path: "/cars", title: "All Cars & Fleet Catalog", group: "Core Pages", isDynamic: false },
    { path: "/car-rental", title: "Chauffeur & Taxi Rental", group: "Core Pages", isDynamic: false },
    { path: "/locations", title: "Rental Locations Hub", group: "Core Pages", isDynamic: false },
    { path: "/airports", title: "Airport Transfers Hub", group: "Core Pages", isDynamic: false },
    { path: "/tours", title: "Tour Packages", group: "Core Pages", isDynamic: false },
    { path: "/about-us", title: "About Us", group: "Core Pages", isDynamic: false },
    { path: "/contact-us", title: "Contact Us", group: "Core Pages", isDynamic: false },
    { path: "/faq", title: "Frequently Asked Questions", group: "Core Pages", isDynamic: false },
    { path: "/terms-and-conditions", title: "Terms and Conditions", group: "Core Pages", isDynamic: false },
    { path: "/privacy-policy", title: "Privacy Policy", group: "Core Pages", isDynamic: false },
    { path: "/cancellation-policy", title: "Cancellation & Refund Policy", group: "Core Pages", isDynamic: false },
    { path: "/cart", title: "Reservation Cart", group: "Core Pages", isDynamic: false },
    { path: "/checkout", title: "Checkout & Verification", group: "Core Pages", isDynamic: false },
    { path: "/blog", title: "Blog Hub", group: "Core Pages", isDynamic: false },
  ];

  const carPages: DiscoverablePage[] = cars.map((c) => ({
    path: `/car/${c.slug}`,
    title: c.name,
    group: "Cars",
    entityType: "CAR",
    entityId: c.id,
    slug: c.slug,
    isDynamic: true,
  }));

  const categoryPages: DiscoverablePage[] = categories.map((cat) => ({
    path: `/cars/${cat.slug}`,
    title: `${cat.name} Category`,
    group: "Categories",
    entityType: "CAR_CATEGORY",
    entityId: cat.id,
    slug: cat.slug,
    isDynamic: true,
  }));

  const locationPages: DiscoverablePage[] = locations.map((loc) => ({
    path: `/car-rental/${loc.slug}`,
    title: `${loc.name} (${loc.city})`,
    group: "Locations",
    entityType: "LOCATION",
    entityId: loc.id,
    slug: loc.slug,
    isDynamic: true,
  }));

  const airportPages: DiscoverablePage[] = airports.map((air) => ({
    path: `/airport-transfer/${air.slug}`,
    title: `${air.name} [${air.code}]`,
    group: "Airports",
    entityType: "AIRPORT",
    entityId: air.id,
    slug: air.slug,
    isDynamic: true,
  }));

  const blogPages: DiscoverablePage[] = blogs.map((b) => ({
    path: `/blog/${b.slug}`,
    title: b.title,
    group: "Blog",
    entityType: "BLOG_POST",
    entityId: b.id,
    slug: b.slug,
    isDynamic: true,
  }));

  const cmsPages: DiscoverablePage[] = pages.map((p) => ({
    path: `/${p.slug}`,
    title: p.title,
    group: "CMS Pages",
    entityType: "PAGE",
    entityId: p.id,
    slug: p.slug,
    isDynamic: true,
  }));

  const customPagesList: DiscoverablePage[] = Array.isArray(customPagesSetting?.value)
    ? (customPagesSetting.value as unknown as DiscoverablePage[])
    : [];

  const allPages: DiscoverablePage[] = [
    ...corePages,
    ...carPages,
    ...categoryPages,
    ...locationPages,
    ...airportPages,
    ...blogPages,
    ...cmsPages,
    ...customPagesList,
  ];

  return ok({
    pages: allPages,
    totalCount: allPages.length,
    counts: {
      core: corePages.length,
      cars: carPages.length,
      categories: categoryPages.length,
      locations: locationPages.length,
      airports: airportPages.length,
      blog: blogPages.length,
      cms: cmsPages.length,
      custom: customPagesList.length,
    },
  });
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("seo.manage");
  const body = await req.json();

  let path = (body.path || "").trim();
  if (!path.startsWith("/")) path = "/" + path;

  const newCustomPage: DiscoverablePage = {
    path,
    title: body.title || path,
    group: "Custom URLs",
    entityType: "CUSTOM",
    isDynamic: false,
  };

  const current = await prisma.setting.findUnique({
    where: { key: "seo.custom_pages" },
  });

  const list: DiscoverablePage[] = Array.isArray(current?.value) ? (current.value as any[]) : [];
  const existingIdx = list.findIndex((p) => p.path === path);
  if (existingIdx >= 0) {
    list[existingIdx] = newCustomPage;
  } else {
    list.push(newCustomPage);
  }

  await prisma.setting.upsert({
    where: { key: "seo.custom_pages" },
    create: {
      key: "seo.custom_pages",
      group: "seo",
      value: list as any,
    },
    update: {
      value: list as any,
    },
  });

  return ok(newCustomPage);
});
