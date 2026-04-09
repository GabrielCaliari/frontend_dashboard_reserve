import { z } from "zod";

/**
 * Admin role enum matching backend AdminRole
 */
export const AdminRole = z.enum([
  "super_admin",
  "owner",
  "manager",
  "editor",
  "viewer",
]);

/**
 * Password validation schema
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one digit
 */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one digit");

/**
 * Email validation schema
 */
const emailSchema = z
  .string()
  .email("Invalid email format")
  .min(1, "Email is required");

/**
 * Name validation schema
 */
const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(100, "Name must be 100 characters or less");

/**
 * Schema for creating a new admin
 * All fields are required including password
 */
export const createAdminSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: AdminRole,
});

/**
 * Schema for updating an existing admin
 * Password is optional for updates
 * All other fields are optional to allow partial updates
 */
export const updateAdminSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  password: passwordSchema
    .optional()
    .or(z.literal(""))
    .transform((v) => v || undefined),
  role: AdminRole.optional(),
});

/**
 * Type inference for create admin form data
 */
export type CreateAdminFormData = z.infer<typeof createAdminSchema>;

/**
 * Type inference for update admin form data
 */
export type UpdateAdminFormData = z.infer<typeof updateAdminSchema>;

/**
 * Type inference for admin role
 */
export type AdminRoleType = z.infer<typeof AdminRole>;
