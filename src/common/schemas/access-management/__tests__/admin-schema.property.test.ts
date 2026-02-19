/**
 * Admin Schema Property-Based Tests
 * 
 * Property tests for admin validation schemas using fast-check
 * Validates: Requirements 2.3, 2.4, 29.1, 29.2
 * 
 * Each test runs 100 iterations to ensure comprehensive input coverage
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  createAdminSchema,
  updateAdminSchema,
  AdminRole,
} from '../admin-schema';

describe('Admin Schema Property Tests', () => {
  describe('Property 7: Email format validation', () => {
    it('should reject invalid email formats', () => {
      // Feature: access-management
      // Property 7: For any email input, invalid formats should be rejected
      // Validates: Requirements 2.3, 29.1

      fc.assert(
        fc.property(
          // Generate strings that are NOT valid emails
          fc.string().filter(s => {
            // Filter out valid email patterns
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return !emailRegex.test(s);
          }),
          (invalidEmail) => {
            const result = createAdminSchema.safeParse({
              name: 'Test User',
              email: invalidEmail,
              password: 'ValidPass123',
              role: 'viewer',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
              const emailErrors = result.error.issues.filter(
                issue => issue.path[0] === 'email'
              );
              expect(emailErrors.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid email formats', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          (validEmail) => {
            const result = createAdminSchema.safeParse({
              name: 'Test User',
              email: validEmail,
              password: 'ValidPass123',
              role: 'viewer',
            });

            if (!result.success) {
              const emailErrors = result.error.issues.filter(
                issue => issue.path[0] === 'email'
              );
              // Should have no email-specific errors
              expect(emailErrors.length).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 8: Password strength validation', () => {
    it('should reject passwords shorter than 8 characters', () => {
      // Feature: access-management
      // Property 8: For any password input, it must be at least 8 characters
      // Validates: Requirements 2.4, 29.2

      fc.assert(
        fc.property(
          fc.string({ maxLength: 7 }),
          (shortPassword) => {
            const result = createAdminSchema.safeParse({
              name: 'Test User',
              email: 'test@example.com',
              password: shortPassword,
              role: 'viewer',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
              const passwordErrors = result.error.issues.filter(
                issue => issue.path[0] === 'password'
              );
              expect(passwordErrors.length).toBeGreaterThan(0);
              expect(
                passwordErrors.some(err => err.message.includes('8 characters'))
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject passwords without uppercase letters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 8, maxLength: 20 }).filter(s => !/[A-Z]/.test(s)),
          (noUppercasePassword) => {
            const result = createAdminSchema.safeParse({
              name: 'Test User',
              email: 'test@example.com',
              password: noUppercasePassword,
              role: 'viewer',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
              const passwordErrors = result.error.issues.filter(
                issue => issue.path[0] === 'password'
              );
              expect(
                passwordErrors.some(err => err.message.includes('uppercase'))
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject passwords without digits', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 8, maxLength: 20 }).filter(s => !/[0-9]/.test(s)),
          (noDigitPassword) => {
            const result = createAdminSchema.safeParse({
              name: 'Test User',
              email: 'test@example.com',
              password: noDigitPassword,
              role: 'viewer',
            });

            expect(result.success).toBe(false);
            if (!result.success) {
              const passwordErrors = result.error.issues.filter(
                issue => issue.path[0] === 'password'
              );
              expect(
                passwordErrors.some(err => err.message.includes('digit'))
              ).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept valid passwords with all requirements', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 8, maxLength: 20 })
            .filter(s => /[A-Z]/.test(s) && /[0-9]/.test(s)),
          (validPassword) => {
            const result = createAdminSchema.safeParse({
              name: 'Test User',
              email: 'test@example.com',
              password: validPassword,
              role: 'viewer',
            });

            if (!result.success) {
              const passwordErrors = result.error.issues.filter(
                issue => issue.path[0] === 'password'
              );
              // Should have no password-specific errors
              expect(passwordErrors.length).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 10: Required field validation', () => {
    it('should reject empty name field', () => {
      // Feature: access-management
      // Property 10: For any form submission with empty required fields, validation should fail
      // Validates: Requirements 29.4

      fc.assert(
        fc.property(
          fc.constant(''),
          (emptyName) => {
            const result = createAdminSchema.safeParse({
              name: emptyName,
              email: 'test@example.com',
              password: 'ValidPass123',
              role: 'viewer',
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
            const result = createAdminSchema.safeParse({
              name: longName,
              email: 'test@example.com',
              password: 'ValidPass123',
              role: 'viewer',
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
  });

  describe('Role validation', () => {
    it('should accept all valid admin roles', () => {
      const validRoles = ['super_admin', 'owner', 'manager', 'editor', 'viewer'] as const;

      fc.assert(
        fc.property(
          fc.constantFrom(...validRoles),
          (role) => {
            const result = createAdminSchema.safeParse({
              name: 'Test User',
              email: 'test@example.com',
              password: 'ValidPass123',
              role: role,
            });

            if (!result.success) {
              const roleErrors = result.error.issues.filter(
                issue => issue.path[0] === 'role'
              );
              // Should have no role-specific errors
              expect(roleErrors.length).toBe(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid role values', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => 
            !['super_admin', 'owner', 'manager', 'editor', 'viewer'].includes(s)
          ),
          (invalidRole) => {
            const result = createAdminSchema.safeParse({
              name: 'Test User',
              email: 'test@example.com',
              password: 'ValidPass123',
              role: invalidRole,
            });

            expect(result.success).toBe(false);
            if (!result.success) {
              const roleErrors = result.error.issues.filter(
                issue => issue.path[0] === 'role'
              );
              expect(roleErrors.length).toBeGreaterThan(0);
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
            const result = updateAdminSchema.safeParse({
              name: name,
            });

            // Should succeed with just name
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept partial updates with only email', () => {
      fc.assert(
        fc.property(
          fc.emailAddress(),
          (email) => {
            const result = updateAdminSchema.safeParse({
              email: email,
            });

            // Should succeed with just email
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept empty update object', () => {
      const result = updateAdminSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
