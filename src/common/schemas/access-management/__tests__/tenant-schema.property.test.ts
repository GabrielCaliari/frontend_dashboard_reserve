/**
 * Tenant Schema Property-Based Tests
 * 
 * Property tests for tenant validation schemas using fast-check
 * Validates: Requirements 9.3, 11.3, 29.3
 * 
 * Each test runs 100 iterations to ensure comprehensive input coverage
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  createTenantSchema,
  updateTenantSchema,
} from '../tenant-schema';

describe('Tenant Schema Property Tests', () => {
  describe('Property 9: Slug format validation', () => {
    it('should reject slugs with uppercase letters', () => {
      // Feature: access-management
      // Property 9: For any slug input, only lowercase letters, numbers, and hyphens should be accepted
      // Validates: Requirements 9.3, 11.3, 29.3

      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => /[A-Z]/.test(s)),
          (uppercaseSlug) => {
            const result = createTenantSchema.safeParse({
              name: 'Test Tenant',
              slug: uppercaseSlug,
              domain: 'example.com',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
              const slugErrors = result.error.issues.filter(
                issue => issue.path[0] === 'slug'
              );
              expect(slugErrors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject slugs with special characters (except hyphens)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 2, maxLength: 50 }).filter(s => 
            /[^a-z0-9-]/.test(s)
          ),
          (invalidSlug) => {
            const result = createTenantSchema.safeParse({
              name: 'Test Tenant',
              slug: invalidSlug,
              domain: 'example.com',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
              const slugErrors = result.error.issues.filter(
                issue => issue.path[0] === 'slug'
              );
              expect(slugErrors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject slugs starting with hyphen', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 49 }).map(s => `-${s}`),
          (slugStartingWithHyphen) => {
            const result = createTenantSchema.safeParse({
              name: 'Test Tenant',
              slug: slugStartingWithHyphen,
              domain: 'example.com',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
              const slugErrors = result.error.issues.filter(
                issue => issue.path[0] === 'slug'
              );
              expect(slugErrors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject slugs ending with hyphen', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 49 }).map(s => `${s}-`),
          (slugEndingWithHyphen) => {
            const result = createTenantSchema.safeParse({
              name: 'Test Tenant',
              slug: slugEndingWithHyphen,
              domain: 'example.com',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
              const slugErrors = result.error.issues.filter(
                issue => issue.path[0] === 'slug'
              );
              expect(slugErrors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject slugs shorter than 2 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 1 }),
          (shortSlug) => {
            const result = createTenantSchema.safeParse({
              name: 'Test Tenant',
              slug: shortSlug,
              domain: 'example.com',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
              const slugErrors = result.error.issues.filter(
                issue => issue.path[0] === 'slug'
              );
              expect(
                slugErrors.some(err => err.message.includes('2 characters'))
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject slugs longer than 50 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 51, maxLength: 100 }),
          (longSlug) => {
            const result = createTenantSchema.safeParse({
              name: 'Test Tenant',
              slug: longSlug,
              domain: 'example.com',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
              const slugErrors = result.error.issues.filter(
                issue => issue.path[0] === 'slug'
              );
              expect(
                slugErrors.some(err => err.message.includes('50 characters'))
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid slugs with lowercase, numbers, and hyphens', () => {
      // Generator for valid slugs
      const validSlugArbitrary = fc.array(
        fc.oneof(
          fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 10 }),
        ),
        { minLength: 1, maxLength: 5 }
      ).map(parts => parts.join('-'));

      fc.assert(
        fc.property(
          validSlugArbitrary.filter(s => s.length >= 2 && s.length <= 50),
          (validSlug) => {
            const result = createTenantSchema.safeParse({
              name: 'Test Tenant',
              slug: validSlug,
              domain: 'example.com',
            });

            if (!result.success) {
              const slugErrors = result.error.issues.filter(
                issue => issue.path[0] === 'slug'
              );
              // Should have no slug-specific errors
              expect(slugErrors.length).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Domain validation', () => {
    it('should reject invalid domain formats', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => {
            // Filter out valid domain patterns
            const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
            return !domainRegex.test(s);
          }),
          (invalidDomain) => {
            const result = createTenantSchema.safeParse({
              name: 'Test Tenant',
              slug: 'test-tenant',
              domain: invalidDomain,
            });

            expect(result.success).toBe(false);
            if (!result.success) {
              const domainErrors = result.error.issues.filter(
                issue => issue.path[0] === 'domain'
              );
              expect(domainErrors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid domain formats', () => {
      fc.assert(
        fc.property(
          fc.domain(),
          (validDomain) => {
            const result = createTenantSchema.safeParse({
              name: 'Test Tenant',
              slug: 'test-tenant',
              domain: validDomain,
            });

            if (!result.success) {
              const domainErrors = result.error.issues.filter(
                issue => issue.path[0] === 'domain'
              );
              // Should have no domain-specific errors
              expect(domainErrors.length).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject domains longer than 255 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 256, maxLength: 300 }),
          (longDomain) => {
            const result = createTenantSchema.safeParse({
              name: 'Test Tenant',
              slug: 'test-tenant',
              domain: longDomain,
            });

            expect(result.success).toBe(false);
            if (!result.success) {
              const domainErrors = result.error.issues.filter(
                issue => issue.path[0] === 'domain'
              );
              expect(
                domainErrors.some(err => err.message.includes('255 characters'))
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Name validation', () => {
    it('should reject empty name', () => {
      fc.assert(
        fc.property(
          fc.constant(''),
          (emptyName) => {
            const result = createTenantSchema.safeParse({
              name: emptyName,
              slug: 'test-tenant',
              domain: 'example.com',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
              const nameErrors = result.error.issues.filter(
                issue => issue.path[0] === 'name'
              );
              expect(nameErrors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject name longer than 100 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 101, maxLength: 200 }),
          (longName) => {
            const result = createTenantSchema.safeParse({
              name: longName,
              slug: 'test-tenant',
              domain: 'example.com',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
              const nameErrors = result.error.issues.filter(
                issue => issue.path[0] === 'name'
              );
              expect(
                nameErrors.some(err => err.message.includes('100 characters'))
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid names', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (validName) => {
            const result = createTenantSchema.safeParse({
              name: validName,
              slug: 'test-tenant',
              domain: 'example.com',
            });

            if (!result.success) {
              const nameErrors = result.error.issues.filter(
                issue => issue.path[0] === 'name'
              );
              // Should have no name-specific errors
              expect(nameErrors.length).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Update schema - optional fields', () => {
    it('should accept partial updates with only name', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (name) => {
            const result = updateTenantSchema.safeParse({
              name: name,
            });

            // Should succeed with just name
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept partial updates with only slug', () => {
      const validSlugArbitrary = fc.array(
        fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789'.split('')), { minLength: 1, maxLength: 10 }),
        { minLength: 1, maxLength: 5 }
      ).map(parts => parts.join('-'));

      fc.assert(
        fc.property(
          validSlugArbitrary.filter(s => s.length >= 2 && s.length <= 50),
          (slug) => {
            const result = updateTenantSchema.safeParse({
              slug: slug,
            });

            // Should succeed with just slug
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept empty update object', () => {
      const result = updateTenantSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
