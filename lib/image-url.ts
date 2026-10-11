import { z } from "zod";

/** Accepts absolute http(s) URLs (S3, CDN) and site-relative paths like `/api/v1/uploads/images/<id>` (database storage). */
export const imageUrlField = z
  .string()
  .trim()
  .refine((v) => /^https?:\/\/\S+$/i.test(v) || /^\/[^\s]*$/.test(v), "Must be a valid image URL or uploaded image path");

export const isValidImageUrl = (v: string) => /^https?:\/\/\S+$/i.test(v) || /^\/[^\s]*$/.test(v);
