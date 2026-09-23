/**
 * Storage provider abstraction — mirrors the map-provider abstraction used
 * for distance pricing. Swap `localStorageProvider` for an S3/Cloudinary/GCS
 * implementation in production without touching any calling code.
 */
export interface UploadedFile {
  url: string;
  filename: string;
}

export interface StorageProvider {
  save(input: { buffer: Buffer; originalName: string; folder: string }): Promise<UploadedFile>;
  delete(input: { folder: string; filename: string }): Promise<void>;
}
