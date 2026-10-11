import { localStorageProvider } from "./local-storage.provider";
import { s3StorageProvider } from "./s3-storage.provider";
import { dbStorageProvider } from "./db-storage.provider";
import { compressImageToUnder1Mb } from "./image-compressor";
import type { StorageProvider, UploadedFile } from "./storage-provider";

export * from "./storage-provider";
export * from "./local-storage.provider";
export * from "./s3-storage.provider";
export * from "./db-storage.provider";
export * from "./image-compressor";

export function getStorageProvider(): StorageProvider {
  if (
    process.env.STORAGE_PROVIDER === "s3" ||
    (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_BUCKET)
  ) {
    return s3StorageProvider;
  }
  return localStorageProvider;
}

export const activeStorageProvider = getStorageProvider();

/**
 * Uploads an image with automatic under-1MB compression:
 * 1. Always compresses the image to high-quality WebP strictly under 1MB.
 * 2. Attempts to upload to AWS S3 first.
 * 3. If S3 fails or is not available (e.g. invalid credentials/network),
 *    automatically falls back to storing in the database `stored_images` table.
 */
/** After an S3 credential/permission failure, skip S3 for a while so uploads stay fast. */
let s3DisabledUntil = 0;
const S3_RETRY_AFTER_MS = 10 * 60_000;
const S3_AUTH_ERRORS = /InvalidAccessKeyId|SignatureDoesNotMatch|AccessDenied|InvalidToken|ExpiredToken|credentials/i;

export async function saveImageWithFallback(input: {
  buffer: Buffer;
  originalName: string;
  folder: string;
}): Promise<UploadedFile & { storageType: "s3" | "database" }> {
  // 1. Always compress image to under 1MB WebP
  const compressed = await compressImageToUnder1Mb(input.buffer, input.originalName);

  // 2. Try S3 upload if configured
  const hasS3Config =
    Boolean(process.env.AWS_ACCESS_KEY_ID?.trim()) &&
    Boolean(process.env.AWS_SECRET_ACCESS_KEY?.trim()) &&
    Boolean(process.env.AWS_S3_BUCKET?.trim());

  if ((hasS3Config || process.env.STORAGE_PROVIDER === "s3") && Date.now() >= s3DisabledUntil) {
    try {
      const s3Result = await s3StorageProvider.save({
        buffer: compressed.buffer,
        originalName: compressed.filename,
        folder: input.folder,
      });
      return { ...s3Result, storageType: "s3" };
    } catch (s3Error: unknown) {
      const msg = s3Error instanceof Error ? s3Error.message : String(s3Error);
      if (S3_AUTH_ERRORS.test(msg)) s3DisabledUntil = Date.now() + S3_RETRY_AFTER_MS;
      console.warn(`[Storage] S3 upload failed (${msg}). Falling back to database table storage (under 1MB compressed).`);
    }
  }

  // 3. Fallback: Save in database table (under 1MB compressed format)
  const dbResult = await dbStorageProvider.save({
    buffer: compressed.buffer,
    originalName: compressed.filename,
    folder: input.folder,
  });

  return { ...dbResult, storageType: "database" };
}

/**
 * Deletes an image from whichever storage it was saved to (database table, S3, or local).
 */
export async function deleteImageWithFallback(url: string, folder: string): Promise<void> {
  try {
    if (url.includes("/api/v1/uploads/images/")) {
      const id = url.split("/api/v1/uploads/images/").pop()?.split(/[?#]/)[0];
      if (id) await dbStorageProvider.delete({ folder, filename: id });
    } else if (url.includes("amazonaws.com")) {
      const filename = url.split("/").pop()?.split(/[?#]/)[0];
      if (filename) await s3StorageProvider.delete({ folder, filename });
    } else {
      const filename = url.split("/").pop()?.split(/[?#]/)[0];
      if (filename) await localStorageProvider.delete({ folder, filename });
    }
  } catch {
    // Ignore deletion errors
  }
}
