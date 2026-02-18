import { z } from 'zod';

export const blogCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().min(1, 'Description is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255, 'Slug is too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only'),
});

export const blogUpdateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long').optional(),
  description: z.string().min(1, 'Description is required').optional(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(255, 'Slug is too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase with hyphens only')
    .optional(),
  status: z.enum(['active', 'inactive']).optional(),
});

export type BlogCreateFormData = z.infer<typeof blogCreateSchema>;
export type BlogUpdateFormData = z.infer<typeof blogUpdateSchema>;
