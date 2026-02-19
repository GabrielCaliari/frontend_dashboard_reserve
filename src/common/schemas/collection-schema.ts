import { z } from "zod";

/**
 * Collection Form Validation Schema
 * 
 * Validates collection creation and update forms with business rules:
 * - Name: 3-100 characters
 * - Slug: lowercase, alphanumeric with hyphens
 * - Type: one of the allowed collection types
 * - MIME types: at least one required
 * - Max file size: positive number in bytes
 * - Max items: optional positive number
 */

export const collectionFormSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must not exceed 100 characters"),
  
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(100, "Slug must not exceed 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase alphanumeric with hyphens only"
    ),
  
  description: z
    .string()
    .max(500, "Description must not exceed 500 characters")
    .optional(),
  
  type: z.enum(["images", "documents", "videos", "mixed"], {
    required_error: "Please select a collection type",
  }),
  
  allowed_mime_types: z
    .array(z.string())
    .min(1, "At least one MIME type must be selected"),
  
  max_file_size: z
    .number()
    .positive("Max file size must be greater than 0"),
  
  max_items: z
    .number()
    .positive("Max items must be greater than 0")
    .optional()
    .nullable(),
});

export type CollectionFormData = z.infer<typeof collectionFormSchema>;

/**
 * Convert form data to DTO for API submission
 * Removes null values and ensures proper typing
 */
export function collectionFormToDto(data: CollectionFormData) {
  return {
    name: data.name,
    slug: data.slug,
    description: data.description || undefined,
    type: data.type,
    allowed_mime_types: data.allowed_mime_types,
    max_file_size: data.max_file_size,
    max_items: data.max_items || undefined,
  };
}

/**
 * Common MIME types by category
 */
export const MIME_TYPES_BY_CATEGORY = {
  images: [
    { value: "image/jpeg", label: "JPEG" },
    { value: "image/png", label: "PNG" },
    { value: "image/gif", label: "GIF" },
    { value: "image/webp", label: "WebP" },
    { value: "image/svg+xml", label: "SVG" },
    { value: "image/bmp", label: "BMP" },
    { value: "image/tiff", label: "TIFF" },
  ],
  documents: [
    { value: "application/pdf", label: "PDF" },
    { value: "application/msword", label: "DOC" },
    { value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "DOCX" },
    { value: "application/vnd.ms-excel", label: "XLS" },
    { value: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", label: "XLSX" },
    { value: "application/vnd.ms-powerpoint", label: "PPT" },
    { value: "application/vnd.openxmlformats-officedocument.presentationml.presentation", label: "PPTX" },
    { value: "text/plain", label: "TXT" },
    { value: "text/csv", label: "CSV" },
  ],
  videos: [
    { value: "video/mp4", label: "MP4" },
    { value: "video/mpeg", label: "MPEG" },
    { value: "video/quicktime", label: "MOV" },
    { value: "video/x-msvideo", label: "AVI" },
    { value: "video/webm", label: "WebM" },
    { value: "video/x-matroska", label: "MKV" },
  ],
  mixed: [
    // All of the above
    { value: "image/jpeg", label: "JPEG" },
    { value: "image/png", label: "PNG" },
    { value: "image/gif", label: "GIF" },
    { value: "image/webp", label: "WebP" },
    { value: "application/pdf", label: "PDF" },
    { value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "DOCX" },
    { value: "video/mp4", label: "MP4" },
    { value: "video/webm", label: "WebM" },
  ],
};

/**
 * File size units for conversion
 */
export const FILE_SIZE_UNITS = [
  { value: 1024, label: "KB" },
  { value: 1024 * 1024, label: "MB" },
  { value: 1024 * 1024 * 1024, label: "GB" },
] as const;
