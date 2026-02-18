import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, 'Max file size is 5MB')
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    'Only .jpg, .jpeg, .png and .webp formats are supported'
  );

export const updateImageSchema = z.object({
  alt_text: z.string()
    .max(255, 'Alt text must be 255 characters or less')
    .optional()
    .nullable(),
  display_order: z.number()
    .int()
    .nonnegative()
    .optional(),
});

export const reorderImagesSchema = z.array(
  z.object({
    id: z.number().positive(),
    display_order: z.number().int().nonnegative(),
  })
).min(1, 'At least one image must be provided');

export type UpdateImageInput = z.infer<typeof updateImageSchema>;
export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;
