import { z } from 'zod';

const emailSchema = z.string().email('Invalid email format').min(1, 'Email is required');
const nameSchema  = z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less');
const phoneSchema = z.string().min(10, 'Phone must be at least 10 digits').optional().or(z.literal(''));

export const updateUserSchema = z.object({
  name:         nameSchema.optional(),
  email:        emailSchema.optional(),
  phone_number: phoneSchema,
});

export const userSchema = z.object({
  name:         nameSchema,
  email:        emailSchema,
  phone_number: phoneSchema,
});

export type UserFormData       = z.infer<typeof userSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
