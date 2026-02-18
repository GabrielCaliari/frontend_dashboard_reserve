import { z } from 'zod';

export const createBlogSchema = z.object({
  name: z.string()
    .min(1, 'Blog name is required')
    .max(150, 'Blog name must be 150 characters or less')
    .trim(),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .nullable(),
});

export const updateBlogSchema = z.object({
  name: z.string()
    .min(1, 'Blog name is required')
    .max(150, 'Blog name must be 150 characters or less')
    .trim()
    .optional(),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .nullable(),
}).refine(data => data.name || data.description, {
  message: 'At least one field must be provided',
});

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
