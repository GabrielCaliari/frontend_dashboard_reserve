/**
 * Property-Based Tests for Slug Generator
 * 
 * These tests validate universal properties that should hold for all inputs.
 * Uses fast-check for property-based testing with minimum 100 iterations.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateSlug, ensureUniqueSlug } from './slug-generator';

describe('generateSlug', () => {
  describe('Unit Tests - Specific Examples', () => {
    it('should convert text to lowercase', () => {
      expect(generateSlug('Hello World')).toBe('hello-world');
      expect(generateSlug('UPPERCASE')).toBe('uppercase');
    });

    it('should replace spaces with hyphens', () => {
      expect(generateSlug('my blog post')).toBe('my-blog-post');
      expect(generateSlug('multiple   spaces')).toBe('multiple-spaces');
    });

    it('should remove special characters', () => {
      expect(generateSlug('Hello@World!')).toBe('helloworld');
      expect(generateSlug('Test#$%Post')).toBe('testpost');
      expect(generateSlug('Special@#$Characters')).toBe('specialcharacters');
    });

    it('should replace underscores with hyphens', () => {
      expect(generateSlug('my_blog_post')).toBe('my-blog-post');
    });

    it('should trim leading and trailing whitespace', () => {
      expect(generateSlug('  trimmed  ')).toBe('trimmed');
      expect(generateSlug('   spaces   ')).toBe('spaces');
    });

    it('should remove leading and trailing hyphens', () => {
      expect(generateSlug('-leading')).toBe('leading');
      expect(generateSlug('trailing-')).toBe('trailing');
      expect(generateSlug('--both--')).toBe('both');
    });

    it('should handle empty strings', () => {
      expect(generateSlug('')).toBe('');
      expect(generateSlug('   ')).toBe('');
    });

    it('should handle strings with only special characters', () => {
      expect(generateSlug('@#$%')).toBe('');
      expect(generateSlug('!!!')).toBe('');
    });

    it('should preserve existing hyphens', () => {
      expect(generateSlug('already-hyphenated')).toBe('already-hyphenated');
    });

    it('should collapse multiple hyphens', () => {
      expect(generateSlug('multiple---hyphens')).toBe('multiple-hyphens');
    });
  });

  describe('Property Tests', () => {
    /**
     * Property 1: Output should always be lowercase
     * For any input string, the output should contain no uppercase characters
     */
    it('should always produce lowercase output', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = generateSlug(input);
          expect(result).toBe(result.toLowerCase());
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2: Output should not contain special characters
     * For any input, the output should only contain alphanumeric characters and hyphens
     */
    it('should only contain alphanumeric characters and hyphens', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = generateSlug(input);
          const validPattern = /^[a-z0-9-]*$/;
          expect(validPattern.test(result)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 3: Output should not have leading or trailing hyphens
     * For any input, the output should not start or end with a hyphen
     */
    it('should not have leading or trailing hyphens', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = generateSlug(input);
          if (result.length > 0) {
            expect(result[0]).not.toBe('-');
            expect(result[result.length - 1]).not.toBe('-');
          }
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4: Output should not contain consecutive hyphens
     * For any input, the output should not have multiple hyphens in a row
     */
    it('should not contain consecutive hyphens', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = generateSlug(input);
          expect(result).not.toContain('--');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5: Idempotence - applying twice should give same result
     * For any input, generateSlug(generateSlug(x)) === generateSlug(x)
     */
    it('should be idempotent', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const once = generateSlug(input);
          const twice = generateSlug(once);
          expect(twice).toBe(once);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6: Length should not increase
     * For any input, the output length should be <= input length
     */
    it('should not increase string length', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = generateSlug(input);
          expect(result.length).toBeLessThanOrEqual(input.length);
        }),
        { numRuns: 100 }
      );
    });
  });
});

describe('ensureUniqueSlug', () => {
  describe('Unit Tests - Specific Examples', () => {
    it('should return base slug when no conflicts exist', () => {
      expect(ensureUniqueSlug('my-post', [])).toBe('my-post');
      expect(ensureUniqueSlug('my-post', ['other-post'])).toBe('my-post');
    });

    it('should append -1 when base slug exists', () => {
      expect(ensureUniqueSlug('my-post', ['my-post'])).toBe('my-post-1');
    });

    it('should append -2 when base slug and -1 exist', () => {
      expect(ensureUniqueSlug('my-post', ['my-post', 'my-post-1'])).toBe('my-post-2');
    });

    it('should find first available number', () => {
      expect(ensureUniqueSlug('my-post', ['my-post', 'my-post-1', 'my-post-2'])).toBe('my-post-3');
    });

    it('should handle gaps in numbering', () => {
      // If -1 and -3 exist but not -2, should return -2
      expect(ensureUniqueSlug('my-post', ['my-post', 'my-post-1', 'my-post-3'])).toBe('my-post-2');
    });

    it('should work with empty base slug', () => {
      expect(ensureUniqueSlug('', [])).toBe('');
      expect(ensureUniqueSlug('', [''])).toBe('-1');
    });
  });

  describe('Property Tests', () => {
    /**
     * Property 1: Slug uniqueness preservation (Validates Requirements 3.4)
     * For any base slug and list of existing slugs, ensureUniqueSlug should 
     * return a slug not in the existing list
     */
    it('should always return a slug not in the existing list', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.array(fc.string(), { maxLength: 50 }),
          (baseSlug, existingSlugs) => {
            const result = ensureUniqueSlug(baseSlug, existingSlugs);
            expect(existingSlugs).not.toContain(result);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2: Result should start with base slug
     * For any base slug, the result should either be the base slug or start with it
     */
    it('should return slug that starts with base slug', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.array(fc.string(), { maxLength: 20 }),
          (baseSlug, existingSlugs) => {
            const result = ensureUniqueSlug(baseSlug, existingSlugs);
            expect(result.startsWith(baseSlug) || result === baseSlug).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 3: Deterministic behavior
     * For the same inputs, should always return the same output
     */
    it('should be deterministic', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.array(fc.string(), { maxLength: 20 }),
          (baseSlug, existingSlugs) => {
            const result1 = ensureUniqueSlug(baseSlug, existingSlugs);
            const result2 = ensureUniqueSlug(baseSlug, existingSlugs);
            expect(result1).toBe(result2);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4: Suffix format validation
     * If a suffix is added, it should be in the format "-N" where N is a positive integer
     */
    it('should add numeric suffix in correct format when needed', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.array(fc.string(), { minLength: 1, maxLength: 20 }),
          (baseSlug, existingSlugs) => {
            // Add base slug to force a suffix
            const slugsWithBase = [...existingSlugs, baseSlug];
            const result = ensureUniqueSlug(baseSlug, slugsWithBase);
            
            if (result !== baseSlug) {
              // Should match pattern: baseSlug-N
              const suffixPattern = new RegExp(`^${baseSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-\\d+$`);
              expect(suffixPattern.test(result)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5: Minimal suffix
     * The numeric suffix should be the smallest positive integer that makes the slug unique
     */
    it('should use the smallest available suffix', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.constantFrom(1, 2, 3, 4, 5), // Test with small numbers
          (baseSlug, maxExisting) => {
            // Create existing slugs: base, base-1, base-2, ..., base-maxExisting
            const existingSlugs = [baseSlug];
            for (let i = 1; i <= maxExisting; i++) {
              existingSlugs.push(`${baseSlug}-${i}`);
            }
            
            const result = ensureUniqueSlug(baseSlug, existingSlugs);
            const expectedSuffix = maxExisting + 1;
            expect(result).toBe(`${baseSlug}-${expectedSuffix}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6: Empty array should return base slug
     * When no existing slugs are provided, should always return the base slug unchanged
     */
    it('should return base slug when existing array is empty', () => {
      fc.assert(
        fc.property(fc.string(), (baseSlug) => {
          const result = ensureUniqueSlug(baseSlug, []);
          expect(result).toBe(baseSlug);
        }),
        { numRuns: 100 }
      );
    });
  });
});
