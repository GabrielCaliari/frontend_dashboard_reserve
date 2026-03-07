import { z } from 'zod';

export const createAuthorSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or less')
    .trim(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or less')
    .trim(),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be 255 characters or less')
    .optional()
    .or(z.literal('')),
  bio: z.string()
    .max(1000, 'Bio must be 1000 characters or less')
    .optional()
    .or(z.literal('')),
  avatar_url: z.string()
    .url('Invalid URL format')
    .max(500, 'Avatar URL must be 500 characters or less')
    .optional()
    .or(z.literal('')),
});

export const updateAuthorSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or less')
    .trim()
    .optional(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or less')
    .trim()
    .optional(),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email must be 255 characters or less')
    .optional()
    .or(z.literal('')),
  bio: z.string()
    .max(1000, 'Bio must be 1000 characters or less')
    .optional()
    .or(z.literal('')),
  avatar_url: z.string()
    .url('Invalid URL format')
    .max(500, 'Avatar URL must be 500 characters or less')
    .optional()
    .or(z.literal('')),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export type CreateAuthorInput = z.infer<typeof createAuthorSchema>;
export type UpdateAuthorInput = z.infer<typeof updateAuthorSchema>;
