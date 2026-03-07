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
  biography: z.string()
    .max(1000, 'Biography must be 1000 characters or less')
    .optional()
    .or(z.literal('')),
  avatarId: z.string()
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
  biography: z.string()
    .max(1000, 'Biography must be 1000 characters or less')
    .optional()
    .or(z.literal('')),
  avatarId: z.string()
    .optional()
    .or(z.literal('')),
});

export type CreateAuthorInput = z.infer<typeof createAuthorSchema>;
export type UpdateAuthorInput = z.infer<typeof updateAuthorSchema>;
