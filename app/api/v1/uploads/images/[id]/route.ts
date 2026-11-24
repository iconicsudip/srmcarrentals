import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!id) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Strip extension if requested like /images/cuid.webp
  const cleanId = id.replace(/\.[^/.]+$/, "");

  // Look at the small details first, so a repeat visitor (or a CDN checking its copy) gets a tiny 304 reply
  // without the photo's bytes being read from the database at all.
  const meta = await prisma.storedImage.findUnique({
    where: { id: cleanId },
    select: { mimeType: true, sizeBytes: true, createdAt: true },
  });
  if (!meta) {
    return new NextResponse("Image not found", { status: 404 });
  }
  const etag = `"${cleanId}-${meta.sizeBytes ?? 0}-${meta.createdAt.getTime()}"`;
  const headers: Record<string, string> = {
    ETag: etag,
    "Cache-Control": "public, max-age=31536000, immutable",
  };
  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers });
  }

  const image = await prisma.storedImage.findUnique({
    where: { id: cleanId },
    select: { data: true },
  });
  if (!image || !image.data) {
    return new NextResponse("Image not found", { status: 404 });
  }

  return new Response(image.data as unknown as BodyInit, {
    status: 200,
    headers: {
      ...headers,
      "Content-Type": meta.mimeType || "image/webp",
      "Content-Length": String(meta.sizeBytes || image.data.length),
    },
  });
}
