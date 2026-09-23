import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/rbac";
import { ok } from "@/lib/http/api-response";
import { withErrorHandling } from "@/lib/http/with-error-handling";

export const GET = withErrorHandling(async (req) => {
  await requirePermission("taxes.manage");
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || undefined;

  const where: any = {};
  if (status && status !== "ALL") {
    where.status = status;
  }

  const taxes = await prisma.tax.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return ok(taxes);
});

export const POST = withErrorHandling(async (req) => {
  await requirePermission("taxes.manage");
  const body = await req.json();

  if (body.isDefault) {
    // Unset existing default
    await prisma.tax.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  const tax = await prisma.tax.create({
    data: {
      name: body.name,
      percentage: body.percentage,
      type: body.type || "PERCENTAGE",
      isDefault: Boolean(body.isDefault),
      status: body.status || "ACTIVE",
    },
  });

  return ok(tax);
});

export const PUT = withErrorHandling(async (req) => {
  await requirePermission("taxes.manage");
  const body = await req.json();
  const { id, ...data } = body;

  if (data.isDefault) {
    await prisma.tax.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const updated = await prisma.tax.update({
    where: { id },
    data,
  });

  return ok(updated);
});

export const DELETE = withErrorHandling(async (req) => {
  await requirePermission("taxes.manage");
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    throw new Error("Missing tax ID");
  }

  await prisma.tax.delete({
    where: { id },
  });

  return ok({ deleted: true });
});
