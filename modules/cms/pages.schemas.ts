import { z } from "zod";

export const createPageSchema = z.object({
  title: z.string().min(1).max(160),
  slug: z.string().min(1).max(180).optional(),
  content: z.string().min(1),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional().default("DRAFT"),
});
export type CreatePageInput = z.infer<typeof createPageSchema>;

export const updatePageSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  slug: z.string().min(1).max(180).optional(),
  content: z.string().min(1).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
});
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
