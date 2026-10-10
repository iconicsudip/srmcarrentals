import { prisma } from "@/lib/prisma";
import type { StorageProvider, UploadedFile } from "./storage-provider";

export const dbStorageProvider: StorageProvider = {
  async save({ buffer, originalName }): Promise<UploadedFile> {
    const record = await prisma.storedImage.create({
      data: {
        filename: originalName,
        mimeType: "image/webp",
        sizeBytes: buffer.length,
        data: new Uint8Array(buffer),
      },
      select: {
        id: true,
        filename: true,
      },
    });

    return {
      url: `/api/v1/uploads/images/${record.id}`,
      filename: record.filename,
    };
  },

  async delete({ filename }): Promise<void> {
    try {
      // filename might be the record ID or extracted from URL
      const id = filename.replace(/\.[^/.]+$/, ""); // strip extension if present
      await prisma.storedImage.delete({ where: { id } }).catch(() => {});
    } catch {
      // ignore if already deleted
    }
  },
};
