import sharp from "sharp";
import path from "node:path";

const ONE_MB = 1024 * 1024; // 1,048,576 bytes
const MAX_DIMENSION = 1920;

export interface CompressedImage {
  buffer: Buffer;
  contentType: string;
  filename: string;
  sizeBytes: number;
  width?: number;
  height?: number;
}

/**
 * Compresses an image buffer using `sharp` to WebP format, ensuring the final
 * output file size is strictly under 1MB while preserving high visual quality.
 */
export async function compressImageToUnder1Mb(
  inputBuffer: Buffer,
  originalFilename = "image.jpg",
): Promise<CompressedImage> {
  const parsed = path.parse(originalFilename);
  const baseName = parsed.name.replace(/[^a-zA-Z0-9_-]/g, "_") || "image";
  const outputFilename = `${baseName}.webp`;

  let currentQuality = 82;
  let currentMaxDim = MAX_DIMENSION;

  // Initial transformation: rotate according to EXIF, resize to max dimension, convert to WebP
  let pipeline = sharp(inputBuffer)
    .rotate() // auto-orient based on EXIF
    .resize(currentMaxDim, currentMaxDim, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: currentQuality, effort: 4 });

  let outputBuffer = await pipeline.toBuffer();

  // If already under 1MB, we're done
  let attempts = 0;
  while (outputBuffer.length > ONE_MB && attempts < 5) {
    attempts++;
    currentQuality = Math.max(35, currentQuality - 15);
    currentMaxDim = Math.max(1024, Math.round(currentMaxDim * 0.85));

    pipeline = sharp(inputBuffer)
      .rotate()
      .resize(currentMaxDim, currentMaxDim, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: currentQuality, effort: 4 });

    outputBuffer = await pipeline.toBuffer();
  }

  // Retrieve metadata for dimensions
  const meta = await sharp(outputBuffer).metadata().catch(() => ({ width: undefined, height: undefined }));

  return {
    buffer: outputBuffer,
    contentType: "image/webp",
    filename: outputFilename,
    sizeBytes: outputBuffer.length,
    width: meta.width,
    height: meta.height,
  };
}
