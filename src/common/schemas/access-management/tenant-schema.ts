import { z } from 'zod';

/**
 * Name validation schema
 */
const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name must be 100 characters or less');

/**
 * Slug validation schema
 * Requirements:
 * - Only lowercase letters, numbers, and hyphens
 * - Cannot start or end with a hyphen
 * - Minimum 2 characters
 */
const slugSchema = z.string()
  .min(2, 'Slug must be at least 2 characters')
  .max(50, 'Slug must be 50 characters or less')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must contain only lowercase letters, numbers, and hyphens (cannot start or end with hyphen)'
  );

/**
 * Domain validation schema
 * Validates standard domain format (e.g., example.com, subdomain.example.com)
 */
const domainSchema = z.string()
  .min(3, 'Domain is required')
  .max(255, 'Domain must be 255 characters or less')
  .regex(
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i,
    'Invalid domain format (e.g., example.com)'
  );

/**
 * Schema for creating a new tenant
 * All fields are required
 */
export const createTenantSchema = z.object({
  name: nameSchema,
  slug: slugSchema,
  domain: domainSchema
});

/**
 * Schema for updating an existing tenant
 * All fields are optional to allow partial updates
 */
export const updateTenantSchema = z.object({
  name: nameSchema.optional(),
  slug: slugSchema.optional(),
  domain: domainSchema.optional()
});

/**
 * Type inference for create tenant form data
 */
export type CreateTenantFormData = z.infer<typeof createTenantSchema>;

/**
 * Type inference for update tenant form data
 */
export type UpdateTenantFormData = z.infer<typeof updateTenantSchema>;
