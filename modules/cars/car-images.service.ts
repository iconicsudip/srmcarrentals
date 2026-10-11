import { prisma } from "@/lib/prisma";
import { BadRequestError, NotFoundError } from "@/lib/http/errors";
import { saveImageWithFallback, deleteImageWithFallback } from "@/lib/storage";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024; // 15MB initial incoming limit, compressed to <1MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export function listCarImages(carId: string) {
  return prisma.carImage.findMany({ where: { carId }, orderBy: { sortOrder: "asc" } });
}

export async function uploadCarImage(carId: string, file: File, altText?: string) {
  const car = await prisma.car.findUnique({ where: { id: carId }, select: { id: true } });
  if (!car) throw new NotFoundError("Car not found");

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new BadRequestError("Unsupported image type — use JPEG, PNG, WebP, or AVIF");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new BadRequestError("Image exceeds the 15MB upload limit");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { url } = await saveImageWithFallback({
    buffer,
    originalName: file.name,
    folder: `cars/${carId}`,
  });

  const [existingCount, maxSort] = await Promise.all([
    prisma.carImage.count({ where: { carId } }),
    prisma.carImage.aggregate({ where: { carId }, _max: { sortOrder: true } }),
  ]);

  // The first image is featured by default. Also take over the featured slot when every existing image
  // is a legacy S3 URL (that bucket is not publicly readable), so the new upload is what visitors see.
  const existing = await prisma.carImage.findMany({ where: { carId }, select: { url: true } });
  const onlyLegacyS3 = existing.length > 0 && existing.every((e) => e.url.includes("amazonaws.com"));
  const makeFeatured = existingCount === 0 || onlyLegacyS3;
  if (makeFeatured && existingCount > 0) {
    await prisma.carImage.updateMany({ where: { carId }, data: { isFeatured: false } });
  }

  return prisma.carImage.create({
    data: {
      carId,
      url,
      altText,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      isFeatured: makeFeatured,
    },
  });
}

export async function updateCarImage(
  carId: string,
  imageId: string,
  data: { altText?: string; isFeatured?: boolean },
) {
  const image = await prisma.carImage.findFirst({ where: { id: imageId, carId } });
  if (!image) throw new NotFoundError("Image not found");

  if (data.isFeatured) {
    await prisma.carImage.updateMany({ where: { carId, id: { not: imageId } }, data: { isFeatured: false } });
  }

  return prisma.carImage.update({ where: { id: imageId }, data });
}

export async function deleteCarImage(carId: string, imageId: string) {
  const image = await prisma.carImage.findFirst({ where: { id: imageId, carId } });
  if (!image) throw new NotFoundError("Image not found");

  await prisma.carImage.delete({ where: { id: imageId } });

  await deleteImageWithFallback(image.url, `cars/${carId}`);

  // Promote another image to featured if the deleted one was featured.
  if (image.isFeatured) {
    const next = await prisma.carImage.findFirst({ where: { carId }, orderBy: { sortOrder: "asc" } });
    if (next) {
      await prisma.carImage.update({ where: { id: next.id }, data: { isFeatured: true } });
    }
  }
}

export async function reorderCarImages(carId: string, orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.carImage.update({ where: { id, carId }, data: { sortOrder: index } }),
    ),
  );
  return listCarImages(carId);
}
