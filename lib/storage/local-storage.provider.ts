import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";

import type { StorageProvider } from "@/lib/storage/storage-provider";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

/** Default storage provider for local development / single-instance
 * deployments: writes to public/uploads/<folder>/ and serves the file
 * straight from Next.js's static file handler. Replace with an S3 (or
 * similar) implementation of `StorageProvider` for production/multi-instance
 * deployments — nothing outside this file needs to change. */
export const localStorageProvider: StorageProvider = {
  async save({ buffer, originalName, folder }) {
    const ext = path.extname(originalName) || "";
    const filename = `${nanoid()}${ext}`;
    const dir = path.join(UPLOADS_ROOT, folder);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);

    return { url: `/uploads/${folder}/${filename}`, filename };
  },

  async delete({ folder, filename }) {
    try {
      await unlink(path.join(UPLOADS_ROOT, folder, filename));
    } catch {
      // already gone — nothing to clean up
    }
  },
};
