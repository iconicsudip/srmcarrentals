import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!id) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Strip extension if requested like /images/cuid.webp
  const cleanId = id.replace(/\.[^/.]+$/, "");

  const image = await prisma.storedImage.findUnique({
    where: { id: cleanId },
    select: { data: true, mimeType: true, sizeBytes: true, createdAt: true },
  });

  if (!image || !image.data) {
    return new NextResponse("Image not found", { status: 404 });
  }

  return new Response(image.data as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": image.mimeType || "image/webp",
      "Content-Length": String(image.sizeBytes || image.data.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
