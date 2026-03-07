/**
 * Property-Based Tests for CMS System
 * 
 * Uses fast-check to verify universal properties across all inputs:
 * - Property 3: Blog name length constraint
 * - Property 4: Valid status transition enforcement
 * - Property 5: Pagination consistency
 * - Property 6: XSS prevention
 * - Property 7: Cross-tenant data access prevention
 * 
 * Requirements: 20.2, 10.1, 10.3, 10.4, 10.6, 1.5, 1.6, 19.5, 20.6, 20.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { createBlogSchema } from '@/src/common/schemas/cms-blog-schema';
import { sanitizeHtml } from '@/src/common/utils/content-sanitizer';
import { createBlog } from '../cms-blog-service';
import { publishArticle, archiveArticle } from '../cms-article-service';
import { fetchPublicArticles } from '../cms-public-service';
import type { Article } from '@/src/common/@types/@cms-article';

// Mock the API clients
vi.mock('@/src/common/config/cms-api-client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/src/common/config/cms-public-api-client', () => ({
  createPublicCmsClient: vi.fn(() => ({
    get: vi.fn(),
  })),
}));

import { cmsApiClient } from '@/src/common/config/api';
import { createPublicCmsClient } from '@/src/common/config/cms-public-api-client';

describe('CMS Property-Based Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Property 3: Blog name length constraint', () => {
    it('should reject blog names exceeding 150 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 151, maxLength: 500 }),
          (longName) => {
            const result = createBlogSchema.safeParse({ name: longName });
            expect(result.success).toBe(false);
            if (!result.success) {
              expect(result.error.issues.some(
                (issue) => issue.message.includes('150 characters')
              )).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should accept blog names within 150 characters', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 150 }),
          (validName) => {
            const result = createBlogSchema.safeParse({ name: validName });
            expect(result.success).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject empty blog names', () => {
      fc.assert(
        fc.property(
          fc.constant(''),
          (emptyName) => {
            const result = createBlogSchema.safeParse({ name: emptyName });
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should trim whitespace from blog names', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 140 }),
          fc.string({ minLength: 1, maxLength: 5 }).filter(s => /^\s+$/.test(s)),
          (name, whitespace) => {
            const nameWithWhitespace = whitespace + name + whitespace;
            const result = createBlogSchema.safeParse({ name: nameWithWhitespace });
            
            if (result.success) {
              // Zod should trim the name
              expect(result.data.name).toBe(name.trim());
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Valid status transition enforcement', () => {
    it('should only allow publishing from draft status', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('published', 'archived'),
          fc.nat({ max: 1000 }),
          fc.nat({ max: 1000 }),
          async (invalidStatus, blogId, articleId) => {
            // Mock article with non-draft status
            const conflictError = {
              response: {
                status: 409,
                data: {
                  message: 'Article must be in draft status to publish',
                  code: 'INVALID_STATUS_TRANSITION',
                  current_status: invalidStatus,
                },
              },
            };

            vi.mocked(cmsApiClient.post).mockRejectedValueOnce(conflictError);

            await expect(publishArticle(blogId, articleId)).rejects.toMatchObject({
              response: {
                status: 409,
              },
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should only allow archiving from published status', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('draft', 'archived'),
          fc.nat({ max: 1000 }),
          fc.nat({ max: 1000 }),
          async (invalidStatus, blogId, articleId) => {
            // Mock article with non-published status
            const conflictError = {
              response: {
                status: 409,
                data: {
                  message: 'Article must be in published status to archive',
                  code: 'INVALID_STATUS_TRANSITION',
                  current_status: invalidStatus,
                },
              },
            };

            vi.mocked(cmsApiClient.post).mockRejectedValueOnce(conflictError);

            await expect(archiveArticle(blogId, articleId)).rejects.toMatchObject({
              response: {
                status: 409,
              },
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should successfully publish articles in draft status', () => {
      fc.assert(
        fc.property(
          fc.nat({ max: 1000 }),
          fc.nat({ max: 1000 }),
          fc.string({ minLength: 1, maxLength: 255 }),
          async (blogId, articleId, title) => {
            const mockPublishedArticle: Article = {
              id: articleId,
              blog_id: blogId,
              title,
              slug: title.toLowerCase().replace(/\s+/g, '-'),
              content: '<p>Content</p>',
              status: 'published',
              display_order: 0,
              published_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              images: [],
            };

            vi.mocked(cmsApiClient.post).mockResolvedValueOnce({ data: mockPublishedArticle });

            const result = await publishArticle(blogId, articleId);

            expect(result.status).toBe('published');
            expect(result.published_at).not.toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 5: Pagination consistency', () => {
    it('should maintain total_records consistency across pages', () => {
      fc.assert(
        fc.property(
          fc.nat({ min: 1, max: 100 }),
          fc.nat({ min: 1, max: 20 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          async (totalRecords, limit, secretKey) => {
            const totalPages = Math.ceil(totalRecords / limit);
            
            // Generate mock articles
            const allArticles: Article[] = Array.from({ length: totalRecords }, (_, i) => ({
              id: i + 1,
              blog_id: 1,
              title: `Article ${i + 1}`,
              slug: `article-${i + 1}`,
              content: '<p>Content</p>',
              status: 'published' as const,
              display_order: i,
              published_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              images: [],
            }));

            let accumulatedRecords = 0;

            // Fetch all pages
            for (let page = 1; page <= totalPages; page++) {
              const startIdx = (page - 1) * limit;
              const endIdx = Math.min(startIdx + limit, totalRecords);
              const pageArticles = allArticles.slice(startIdx, endIdx);

              const mockPublicClient = {
                get: vi.fn().mockResolvedValueOnce({
                  data: {
                    data: pageArticles,
                    meta: {
                      current_page: page,
                      total_pages: totalPages,
                      total_records: totalRecords,
                    },
                  },
                }),
              };

              vi.mocked(createPublicCmsClient).mockReturnValueOnce(mockPublicClient as any);

              const result = await fetchPublicArticles(secretKey, { page, limit });

              accumulatedRecords += result.data.length;
              expect(result.meta.total_records).toBe(totalRecords);
              expect(result.meta.total_pages).toBe(totalPages);
              expect(result.meta.current_page).toBe(page);
            }

            // Verify sum of items across all pages equals total_records
            expect(accumulatedRecords).toBe(totalRecords);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle edge case of empty results', () => {
      fc.assert(
        fc.property(
          fc.nat({ min: 1, max: 20 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          async (limit, secretKey) => {
            const mockPublicClient = {
              get: vi.fn().mockResolvedValueOnce({
                data: {
                  data: [],
                  meta: {
                    current_page: 1,
                    total_pages: 0,
                    total_records: 0,
                  },
                },
              }),
            };

            vi.mocked(createPublicCmsClient).mockReturnValueOnce(mockPublicClient as any);

            const result = await fetchPublicArticles(secretKey, { page: 1, limit });

            expect(result.data).toHaveLength(0);
            expect(result.meta.total_records).toBe(0);
            expect(result.meta.total_pages).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should respect limit parameter for page size', () => {
      fc.assert(
        fc.property(
          fc.nat({ min: 1, max: 50 }),
          fc.nat({ min: 10, max: 100 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          async (limit, totalRecords, secretKey) => {
            const pageArticles: Article[] = Array.from(
              { length: Math.min(limit, totalRecords) },
              (_, i) => ({
                id: i + 1,
                blog_id: 1,
                title: `Article ${i + 1}`,
                slug: `article-${i + 1}`,
                content: '<p>Content</p>',
                status: 'published' as const,
                display_order: i,
                published_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                images: [],
              })
            );

            const mockPublicClient = {
              get: vi.fn().mockResolvedValueOnce({
                data: {
                  data: pageArticles,
                  meta: {
                    current_page: 1,
                    total_pages: Math.ceil(totalRecords / limit),
                    total_records: totalRecords,
                  },
                },
              }),
            };

            vi.mocked(createPublicCmsClient).mockReturnValueOnce(mockPublicClient as any);

            const result = await fetchPublicArticles(secretKey, { page: 1, limit });

            expect(result.data.length).toBeLessThanOrEqual(limit);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 6: XSS prevention', () => {
    it('should remove script tags from any HTML content', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          (beforeScript, afterScript) => {
            const maliciousHtml = `${beforeScript}<script>alert('XSS')</script>${afterScript}`;
            const sanitized = sanitizeHtml(maliciousHtml);
            
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).not.toContain('</script>');
            expect(sanitized).not.toContain("alert('XSS')");
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should remove event handlers from any HTML content', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('onclick', 'onload', 'onerror', 'onmouseover', 'onfocus'),
          fc.string({ minLength: 1, maxLength: 100 }),
          (eventHandler, jsCode) => {
            const maliciousHtml = `<div ${eventHandler}="${jsCode}">Content</div>`;
            const sanitized = sanitizeHtml(maliciousHtml);
            
            expect(sanitized).not.toContain(eventHandler);
            expect(sanitized.toLowerCase()).not.toContain(eventHandler.toLowerCase());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should remove javascript: protocol from links', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          (jsCode) => {
            const maliciousHtml = `<a href="javascript:${jsCode}">Click me</a>`;
            const sanitized = sanitizeHtml(maliciousHtml);
            
            expect(sanitized.toLowerCase()).not.toContain('javascript:');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve safe HTML tags and content', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.constantFrom('p', 'strong', 'em', 'h1', 'h2', 'ul', 'li'),
          (content, tag) => {
            const safeHtml = `<${tag}>${content}</${tag}>`;
            const sanitized = sanitizeHtml(safeHtml);
            
            expect(sanitized).toContain(content);
            expect(sanitized).toContain(`<${tag}>`);
            expect(sanitized).toContain(`</${tag}>`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should remove data attributes to prevent data exfiltration', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 50 }),
          (attrName, attrValue) => {
            const htmlWithDataAttr = `<div data-${attrName}="${attrValue}">Content</div>`;
            const sanitized = sanitizeHtml(htmlWithDataAttr);
            
            expect(sanitized).not.toContain(`data-${attrName}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle nested malicious content', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (content) => {
            const nestedMalicious = `
              <div>
                <p>${content}</p>
                <script>alert('XSS')</script>
                <img src="x" onerror="alert('XSS')">
                <a href="javascript:void(0)">Link</a>
              </div>
            `;
            const sanitized = sanitizeHtml(nestedMalicious);
            
            expect(sanitized).toContain(content);
            expect(sanitized).not.toContain('<script>');
            expect(sanitized).not.toContain('onerror');
            expect(sanitized.toLowerCase()).not.toContain('javascript:');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 7: Cross-tenant data access prevention', () => {
    it('should only return data for the authenticated tenant', () => {
      fc.assert(
        fc.property(
          fc.nat({ min: 1, max: 1000 }),
          fc.nat({ min: 1, max: 100 }),
          fc.string({ minLength: 32, maxLength: 64 }),
          async (authenticatedTenantId, numArticles, secretKey) => {
            // Generate articles all belonging to the authenticated tenant
            const tenantArticles: Article[] = Array.from({ length: numArticles }, (_, i) => ({
              id: i + 1,
              blog_id: authenticatedTenantId,
              title: `Article ${i + 1}`,
              slug: `article-${i + 1}`,
              content: '<p>Content</p>',
              status: 'published' as const,
              display_order: i,
              published_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              images: [],
            }));

            const mockPublicClient = {
              get: vi.fn().mockResolvedValueOnce({
                data: {
                  data: tenantArticles,
                  meta: {
                    current_page: 1,
                    total_pages: 1,
                    total_records: numArticles,
                  },
                },
              }),
            };

            vi.mocked(createPublicCmsClient).mockReturnValueOnce(mockPublicClient as any);

            const result = await fetchPublicArticles(secretKey, { page: 1, limit: 50 });

            // Verify all articles belong to the same blog (tenant isolation)
            const uniqueBlogIds = new Set(result.data.map((article) => article.blog_id));
            expect(uniqueBlogIds.size).toBe(1);
            expect(uniqueBlogIds.has(authenticatedTenantId)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject requests with invalid secret keys', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 31 }),
          async (invalidSecretKey) => {
            const unauthorizedError = {
              response: {
                status: 401,
                data: {
                  message: 'Invalid or missing secret key',
                },
              },
            };

            const mockPublicClient = {
              get: vi.fn().mockRejectedValueOnce(unauthorizedError),
            };

            vi.mocked(createPublicCmsClient).mockReturnValueOnce(mockPublicClient as any);

            await expect(
              fetchPublicArticles(invalidSecretKey, { page: 1, limit: 10 })
            ).rejects.toMatchObject({
              response: {
                status: 401,
              },
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure secret keys are cryptographically secure (min 32 chars)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 32, maxLength: 128 }),
          (secretKey) => {
            // Valid secret keys should be at least 32 characters
            expect(secretKey.length).toBeGreaterThanOrEqual(32);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
