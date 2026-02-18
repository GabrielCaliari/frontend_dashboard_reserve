import { z } from 'zod';

export const blogCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name must be 150 characters or less'),
  description: z.string().optional(),
});

export const blogUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150, 'Name must be 150 characters or less').optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

export type BlogCreateFormData = z.infer<typeof blogCreateSchema>;
export type BlogUpdateFormData = z.infer<typeof blogUpdateSchema>;
