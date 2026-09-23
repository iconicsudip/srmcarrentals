import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().max(20).optional(),
  roleId: z.string().min(1),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  firstName: z.string().min(1).max(80).optional(),
  lastName: z.string().min(1).max(80).optional(),
  phone: z.string().max(20).optional(),
  roleId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
