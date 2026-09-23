import { z } from "zod";

export const createRoleSchema = z.object({
  name: z.enum(["SUPER_ADMIN", "ADMIN", "BOOKING_MANAGER", "STAFF", "DRIVER", "CUSTOMER"]),
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
