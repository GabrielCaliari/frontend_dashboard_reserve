import { z } from 'zod';

export const createArticleSchema = z.object({
  title: z.string()
    .min(1, 'Article title is required')
    .max(255, 'Article title must be 255 characters or less')
    .trim(),
  content: z.string()
    .min(1, 'Article content is required'),
});

export const updateArticleSchema = z.object({
  title: z.string()
    .min(1, 'Article title is required')
    .max(255, 'Article title must be 255 characters or less')
    .trim()
    .optional(),
  content: z.string()
    .min(1, 'Article content is required')
    .optional(),
}).refine(data => data.title || data.content, {
  message: 'At least one field must be provided',
});

export const reorderArticlesSchema = z.array(
  z.object({
    id: z.number().positive(),
    display_order: z.number().int().nonnegative(),
  })
).min(1, 'At least one article must be provided');

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ReorderArticlesInput = z.infer<typeof reorderArticlesSchema>;
