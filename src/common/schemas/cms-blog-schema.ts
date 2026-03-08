import { z } from 'zod';

export const createBlogSchema = z.object({
  name: z.string()
    .min(1, 'Blog name is required')
    .max(150, 'Blog name must be 150 characters or less')
    .trim(),
  mediaCollectionId: z.string()
    .min(1, 'Media collection is required')
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
  mediaCollectionId: z.string()
    .min(1, 'Media collection is required')
    .trim()
    .optional(),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .nullable(),
  active: z.boolean().optional(),
}).refine(data => (
  data.name !== undefined ||
  data.description !== undefined ||
  data.mediaCollectionId !== undefined ||
  data.active !== undefined
), {
  message: 'At least one field must be provided',
});

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
