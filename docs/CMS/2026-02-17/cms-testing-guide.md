# CMS Testing Guide

## Overview

This document describes the comprehensive testing strategy for the CMS Blog and Articles Integration feature. The testing approach includes both integration tests for critical workflows and property-based tests for universal correctness properties.

## Test Files

### Integration Tests
**Location**: `src/common/services/__tests__/cms-integration.test.ts`

Tests complete workflows and critical user journeys:
- Blog creation → Article creation → Publish flow
- Article reordering with multiple articles
- Image upload → Reorder → Delete flow
- Public API with secret key authentication
- Secret key regeneration and invalidation

### Property-Based Tests
**Location**: `src/common/services/__tests__/cms-property-tests.test.ts`

Tests universal properties across all possible inputs using fast-check library with 100 iterations per property.

## Property-Based Tests

### Property 3: Blog Name Length Constraint
**Validates**: Requirements 20.2

**Property**: For any blog creation request, names exceeding 150 characters should be rejected.

**Test Cases**:
- Rejects names with 151-500 characters
- Accepts names with 1-150 characters
- Rejects empty names
- Trims whitespace from names

**Implementation**:
```typescript
fc.assert(
  fc.property(
    fc.string({ minLength: 151, maxLength: 500 }),
    (longName) => {
      const result = createBlogSchema.safeParse({ name: longName });
      expect(result.success).toBe(false);
    }
  ),
  { numRuns: 100 }
);
```

### Property 4: Valid Status Transition Enforcement
**Validates**: Requirements 10.1, 10.3, 10.4, 10.6

**Property**: For any article, publishing should only succeed from draft status, and archiving should only succeed from published status.

**Test Cases**:
- Publishing from 'published' or 'archived' status returns 409 conflict
- Archiving from 'draft' or 'archived' status returns 409 conflict
- Publishing from 'draft' status succeeds and sets published_at
- Archiving from 'published' status succeeds and maintains published_at

**Implementation**:
```typescript
fc.assert(
  fc.property(
    fc.constantFrom('published', 'archived'),
    fc.nat({ max: 1000 }),
    fc.nat({ max: 1000 }),
    async (invalidStatus, blogId, articleId) => {
      // Verify 409 conflict for invalid transitions
      await expect(publishArticle(blogId, articleId)).rejects.toMatchObject({
        response: { status: 409 }
      });
    }
  ),
  { numRuns: 100 }
);
```

### Property 5: Pagination Consistency
**Validates**: Requirements 1.5, 1.6

**Property**: For any valid page and limit parameters, the sum of items across all pages should equal total_records.

**Test Cases**:
- Accumulates records across all pages and verifies sum equals total_records
- Handles edge case of empty results (0 records)
- Respects limit parameter for page size
- Maintains consistent total_records across all page requests

**Implementation**:
```typescript
fc.assert(
  fc.property(
    fc.nat({ min: 1, max: 100 }),
    fc.nat({ min: 1, max: 20 }),
    fc.string({ minLength: 32, maxLength: 64 }),
    async (totalRecords, limit, secretKey) => {
      let accumulatedRecords = 0;
      const totalPages = Math.ceil(totalRecords / limit);
      
      for (let page = 1; page <= totalPages; page++) {
        const result = await fetchPublicArticles(secretKey, { page, limit });
        accumulatedRecords += result.data.length;
      }
      
      expect(accumulatedRecords).toBe(totalRecords);
    }
  ),
  { numRuns: 100 }
);
```

### Property 6: XSS Prevention
**Validates**: Requirements 19.5, 20.6

**Property**: For any HTML content containing script tags or event handlers, sanitization should remove all executable code.

**Test Cases**:
- Removes `<script>` tags from any position in HTML
- Removes event handlers (onclick, onload, onerror, onmouseover, onfocus)
- Removes `javascript:` protocol from links
- Preserves safe HTML tags (p, strong, em, h1-h6, ul, li)
- Removes data attributes to prevent data exfiltration
- Handles nested malicious content

**Implementation**:
```typescript
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
```

### Property 7: Cross-Tenant Data Access Prevention
**Validates**: Requirements 20.4

**Property**: For any API request, data returned should only belong to the authenticated user's tenant.

**Test Cases**:
- All articles in response belong to the same blog (tenant isolation)
- Rejects requests with invalid secret keys (< 32 characters)
- Ensures secret keys are cryptographically secure (≥ 32 characters)
- Verifies unique blog IDs in result set

**Implementation**:
```typescript
fc.assert(
  fc.property(
    fc.nat({ min: 1, max: 1000 }),
    fc.nat({ min: 1, max: 100 }),
    fc.string({ minLength: 32, maxLength: 64 }),
    async (authenticatedTenantId, numArticles, secretKey) => {
      const result = await fetchPublicArticles(secretKey, { page: 1, limit: 50 });
      
      const uniqueBlogIds = new Set(result.data.map(article => article.blog_id));
      expect(uniqueBlogIds.size).toBe(1);
      expect(uniqueBlogIds.has(authenticatedTenantId)).toBe(true);
    }
  ),
  { numRuns: 100 }
);
```

## Integration Tests

### Flow 1: Blog Creation → Article Creation → Publish
**Requirements**: 3.1, 6.1, 10.1

**Steps**:
1. Create a blog with name and description
2. Verify blog has generated slug and secret_key (≥ 32 chars)
3. Create an article in draft status
4. Verify article has status='draft' and published_at=null
5. Publish the article
6. Verify article has status='published' and published_at is set
7. Fetch article via public API using secret key
8. Verify article is accessible and has correct data

**Edge Cases**:
- Prevent publishing article not in draft status (409 conflict)

### Flow 2: Article Reordering
**Requirements**: 11.1, 11.2, 11.3

**Steps**:
1. Create multiple articles with sequential display_order
2. Reorder articles by changing display_order values
3. Verify articles are returned in new order
4. Test reordering with gaps in display_order (allowed)

### Flow 3: Public API Authentication
**Requirements**: 1.1, 2.1, 2.2, 2.3

**Steps**:
1. Fetch published articles using valid secret key
2. Verify pagination metadata is correct
3. Fetch article by slug using secret key
4. Verify article includes images
5. Test 404 error for non-existent slug
6. Verify only published articles are returned

### Flow 4: Secret Key Regeneration
**Requirements**: 5.1, 5.2, 5.3

**Steps**:
1. Fetch blog with current secret key
2. Regenerate secret key
3. Verify new key is different from old key
4. Verify new key is ≥ 32 characters
5. Verify old key is invalidated

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Integration Tests Only
```bash
npm test -- src/common/services/__tests__/cms-integration.test.ts
```

### Run Property-Based Tests Only
```bash
npm test -- src/common/services/__tests__/cms-property-tests.test.ts
```

### Run Tests with UI
```bash
npm run test:ui
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

## Test Configuration

**Framework**: Vitest 4.0.18  
**Property Testing**: fast-check 4.5.3  
**Environment**: jsdom  
**Iterations per Property**: 100 (configurable via `numRuns`)

## Coverage Requirements

- All critical user flows must have integration tests
- All universal correctness properties must have property-based tests
- Minimum 100 iterations per property test
- All edge cases and error conditions must be tested

## Best Practices

1. **Property Tests**: Focus on universal properties that should hold for all inputs
2. **Integration Tests**: Focus on complete workflows and user journeys
3. **Mocking**: Mock API clients to isolate service layer logic
4. **Assertions**: Use specific assertions that verify exact behavior
5. **Error Cases**: Test both success and failure scenarios
6. **Edge Cases**: Include boundary conditions and special cases

## Maintenance

- Update tests when requirements change
- Add new property tests for new universal constraints
- Keep integration tests aligned with user workflows
- Review test coverage regularly
- Refactor tests to reduce duplication

## Troubleshooting

### Tests Timeout
- Increase timeout in vitest.config.ts
- Reduce numRuns for property tests during development
- Check for infinite loops in test logic

### Flaky Tests
- Ensure proper mocking of API clients
- Clear mocks between tests with `beforeEach`
- Avoid time-dependent assertions
- Use deterministic test data

### Property Test Failures
- Review the counterexample provided by fast-check
- Verify the property is correctly specified
- Check if edge cases are handled in implementation
- Adjust generators if needed to produce valid inputs

## Future Enhancements

- Add E2E tests for UI components
- Add performance tests for pagination
- Add load tests for concurrent requests
- Add mutation testing to verify test quality
- Add visual regression tests for public pages
