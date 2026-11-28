import { z } from "zod";

import { optionalPhoneSchema } from "@/lib/phone";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: optionalPhoneSchema,
  roleId: z.string().min(1),
  /** Limit this user to the bookings of the locations in `locationIds` */
  restrictToLocations: z.boolean().optional(),
  locationIds: z.array(z.string()).optional(),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: optionalPhoneSchema,
  roleId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
  restrictToLocations: z.boolean().optional(),
  locationIds: z.array(z.string()).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
