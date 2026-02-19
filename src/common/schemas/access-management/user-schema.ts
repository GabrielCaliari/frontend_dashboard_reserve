import { z } from 'zod';

/**
 * Email validation schema
 * Reused from admin schema pattern for consistency
 */
const emailSchema = z.string()
  .email('Invalid email format')
  .min(1, 'Email is required');

/**
 * Name validation schema
 */
const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name must be 100 characters or less');

/**
 * Schema for updating a user
 * Users only have name and email fields (no password or role)
 * All fields are optional to allow partial updates
 */
export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional()
});

/**
 * Schema for user form with all required fields
 * Used for validation when all fields must be present
 */
export const userSchema = z.object({
  name: nameSchema,
  email: emailSchema
});

/**
 * Type inference for user form data
 */
export type UserFormData = z.infer<typeof userSchema>;

/**
 * Type inference for update user form data
 */
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
