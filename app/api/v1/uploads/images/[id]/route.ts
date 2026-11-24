import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

type StoredImageFull = {
  data: Uint8Array;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
};

// Deduplicate concurrent cold fetches for the exact same image ID so parallel requests share one DB round-trip.
const inFlight = new Map<string, Promise<StoredImageFull | null>>();

function fetchStoredImage(id: string): Promise<StoredImageFull | null> {
  const existing = inFlight.get(id);
  if (existing) return existing;

  const promise = prisma.storedImage
    .findUnique({
      where: { id },
      select: { data: true, mimeType: true, sizeBytes: true, createdAt: true },
    })
    .finally(() => {
      inFlight.delete(id);
    });

  inFlight.set(id, promise);
  return promise;
}

function buildEtag(id: string, sizeBytes: number | null | undefined, createdAt: Date): string {
  return `"${id}-${sizeBytes ?? 0}-${createdAt.getTime()}"`;
}

export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!id) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Strip extension if requested like /images/cuid.webp
  const cleanId = id.replace(/\.[^/.]+$/, "");
  const ifNoneMatch = req.headers.get("if-none-match");

  // Only do the lightweight metadata-only lookup when the caller sent If-None-Match;
  // otherwise fetch metadata + bytes in a single DB query to avoid doubling round-trips.
  if (ifNoneMatch) {
    const meta = await prisma.storedImage.findUnique({
      where: { id: cleanId },
      select: { sizeBytes: true, createdAt: true },
    });
    if (!meta) {
      return new NextResponse("Image not found", { status: 404 });
    }
    const etag = buildEtag(cleanId, meta.sizeBytes, meta.createdAt);
    if (ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }

  const image = await fetchStoredImage(cleanId);
  if (!image || !image.data) {
    return new NextResponse("Image not found", { status: 404 });
  }

  const etag = buildEtag(cleanId, image.sizeBytes, image.createdAt);

  return new Response(image.data as unknown as BodyInit, {
    status: 200,
    headers: {
      ETag: etag,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Type": image.mimeType || "image/webp",
      "Content-Length": String(image.sizeBytes || image.data.length),
    },
  });
}
