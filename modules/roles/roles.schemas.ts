import { z } from "zod";

export const createRoleSchema = z.object({
  /** Optional key; made from the label when left out (e.g. "City Manager" → CITY_MANAGER) */
  name: z.string().min(2).max(60).optional(),
  label: z.string().min(2).max(60),
  description: z.string().max(500).optional(),
  permissionKeys: z.array(z.string()).default([]),
});
export type CreateRoleInput = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  label: z.string().min(2).max(60).optional(),
  description: z.string().max(500).optional(),
  permissionKeys: z.array(z.string()).optional(),
});
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
