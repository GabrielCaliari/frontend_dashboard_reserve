/**
 * Slug Generator Utility
 * 
 * Generates URL-friendly slugs from text strings and ensures uniqueness.
 * Used for creating blog and article slugs from titles.
 */

/**
 * Generates a URL-friendly slug from a text string.
 * 
 * Transformations applied:
 * - Converts to lowercase
 * - Trims whitespace
 * - Removes special characters (keeps alphanumeric, spaces, hyphens, underscores)
 * - Replaces spaces and underscores with hyphens
 * - Removes leading and trailing hyphens
 * 
 * @param text - The input text to convert to a slug
 * @returns A URL-friendly slug string
 * 
 * @example
 * generateSlug("Hello World!") // "hello-world"
 * generateSlug("  My Blog Post  ") // "my-blog-post"
 * generateSlug("Special@#$Characters") // "specialcharacters"
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Ensures a slug is unique by appending a numeric suffix if needed.
 * 
 * If the base slug exists in the provided list, appends "-1", "-2", etc.
 * until a unique slug is found.
 * 
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug not present in existingSlugs
 * 
 * @example
 * ensureUniqueSlug("my-post", ["my-post"]) // "my-post-1"
 * ensureUniqueSlug("my-post", ["my-post", "my-post-1"]) // "my-post-2"
 * ensureUniqueSlug("my-post", []) // "my-post"
 */
export const ensureUniqueSlug = (baseSlug: string, existingSlugs: string[]): string => {
  let slug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};
