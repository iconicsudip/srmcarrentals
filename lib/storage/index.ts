import { localStorageProvider } from "./local-storage.provider";
import { s3StorageProvider } from "./s3-storage.provider";
import type { StorageProvider } from "./storage-provider";

export * from "./storage-provider";
export * from "./local-storage.provider";
export * from "./s3-storage.provider";

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
