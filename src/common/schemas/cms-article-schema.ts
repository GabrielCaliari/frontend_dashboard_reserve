import { z } from 'zod';

export const createArticleSchema = z.object({
  displayTitle: z.string()
    .min(1, 'Article title is required')
    .max(255, 'Article title must be 255 characters or less')
    .trim(),
  slug: z.string()
    .min(1, 'Slug is required')
    .max(255, 'Slug must be 255 characters or less')
    .trim(),
  content: z.string()
    .min(1, 'Article content is required'),
  metaTitle: z.string()
    .max(60, 'Meta title must be 60 characters or less')
    .optional()
    .or(z.literal('')),
  metaDescription: z.string()
    .max(160, 'Meta description must be 160 characters or less')
    .optional()
    .or(z.literal('')),
  focusKeyword: z.string()
    .max(100, 'Focus keyword must be 100 characters or less')
    .optional()
    .or(z.literal('')),
  authorId: z.string()
    .min(1, 'Author is required'),
  blogId: z.string().optional(),
  coverImageId: z.string().optional().or(z.literal('')),
});

export const updateArticleSchema = z.object({
  displayTitle: z.string()
    .min(1, 'Article title is required')
    .max(255, 'Article title must be 255 characters or less')
    .trim()
    .optional(),
  slug: z.string()
    .max(255, 'Slug must be 255 characters or less')
    .trim()
    .optional(),
  content: z.string()
    .min(1, 'Article content is required')
    .optional(),
  metaTitle: z.string()
    .max(60, 'Meta title must be 60 characters or less')
    .optional()
    .or(z.literal('')),
  metaDescription: z.string()
    .max(160, 'Meta description must be 160 characters or less')
    .optional()
    .or(z.literal('')),
  focusKeyword: z.string()
    .max(100, 'Focus keyword must be 100 characters or less')
    .optional()
    .or(z.literal('')),
  authorId: z.string().optional(),
  blogId: z.string().optional(),
  coverImageId: z.string().optional().or(z.literal('')),
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
