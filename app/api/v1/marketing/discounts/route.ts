import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";

const DEFAULT_DISCOUNTS = [
  {
    id: "disc_weekly",
    name: "Weekly Rental Incentive",
    type: "DURATION",
    minDays: 7,
    maxDays: 14,
    discountPercentage: 10,
    isActive: true,
    description: "Automatic 10% discount for bookings between 7 and 14 days",
  },
  {
    id: "disc_fortnight",
    name: "Fortnight Explorer",
    type: "DURATION",
    minDays: 15,
    maxDays: 29,
    discountPercentage: 15,
    isActive: true,
    description: "Automatic 15% discount for bookings between 15 and 29 days",
  },
  {
    id: "disc_monthly",
    name: "Monthly Long-Term Lease",
    type: "DURATION",
    minDays: 30,
    maxDays: null,
    discountPercentage: 25,
    isActive: true,
    description: "Premium 25% discount for extended monthly subscriptions (30+ days)",
  },
  {
    id: "disc_weekend",
    name: "Weekend Getaway Promo",
    type: "SEASONAL",
    minDays: 3,
    maxDays: 4,
    discountPercentage: 5,
    isActive: false,
    description: "Special 5% weekend package discount",
  },
];

export const GET = withErrorHandling(async () => {
  await requirePermission("coupons.manage");

  const setting = await prisma.setting.findUnique({
    where: { key: "marketing.discounts" },
  });

  if (!setting) {
    return ok(DEFAULT_DISCOUNTS);
  }

  return ok(setting.value);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("coupons.manage");
  const body = await req.json();

  const setting = await prisma.setting.findUnique({
    where: { key: "marketing.discounts" },
  });

  const currentList = Array.isArray(setting?.value) ? (setting.value as any[]) : DEFAULT_DISCOUNTS;

  const newRule = {
    id: `disc_${Date.now()}`,
    name: body.name,
    type: body.type || "DURATION",
    minDays: Number(body.minDays) || 1,
    maxDays: body.maxDays ? Number(body.maxDays) : null,
    discountPercentage: Number(body.discountPercentage) || 0,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
    description: body.description || "",
  };

  const updatedList = [...currentList, newRule];

  await prisma.setting.upsert({
    where: { key: "marketing.discounts" },
    create: {
      key: "marketing.discounts",
      group: "marketing",
      value: updatedList,
    },
    update: {
      value: updatedList,
    },
  });

  return ok(newRule);
});

export const PUT = withErrorHandling(async (req) => {
  await requirePermission("coupons.manage");
  const body = await req.json();

  // Can receive updated array or single rule update
  if (Array.isArray(body)) {
    await prisma.setting.upsert({
      where: { key: "marketing.discounts" },
      create: {
        key: "marketing.discounts",
        group: "marketing",
        value: body,
      },
      update: {
        value: body,
      },
    });
    return ok(body);
  }

  const setting = await prisma.setting.findUnique({
    where: { key: "marketing.discounts" },
  });

  const currentList = Array.isArray(setting?.value) ? (setting.value as any[]) : DEFAULT_DISCOUNTS;
  const updatedList = currentList.map((item) => (item.id === body.id ? { ...item, ...body } : item));

  await prisma.setting.upsert({
    where: { key: "marketing.discounts" },
    create: {
      key: "marketing.discounts",
      group: "marketing",
      value: updatedList,
    },
    update: {
      value: updatedList,
    },
  });

  return ok(updatedList);
});

export const DELETE = withErrorHandling(async (req) => {
  await requirePermission("coupons.manage");
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    throw new Error("Missing discount ID");
  }

  const setting = await prisma.setting.findUnique({
    where: { key: "marketing.discounts" },
  });

  const currentList = Array.isArray(setting?.value) ? (setting.value as any[]) : DEFAULT_DISCOUNTS;
  const updatedList = currentList.filter((item) => item.id !== id);

  await prisma.setting.upsert({
    where: { key: "marketing.discounts" },
    create: {
      key: "marketing.discounts",
      group: "marketing",
      value: updatedList,
    },
    update: {
      value: updatedList,
    },
  });

  return ok({ deleted: true });
});
