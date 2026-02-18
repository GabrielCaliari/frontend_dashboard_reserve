/**
 * Property-Based Tests for Content Sanitizer
 * 
 * These tests validate universal properties for HTML sanitization and XSS prevention.
 * Uses fast-check for property-based testing with minimum 100 iterations.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sanitizeHtml, stripHtml, truncateHtml } from './content-sanitizer';

describe('sanitizeHtml', () => {
  describe('Unit Tests - Specific Examples', () => {
    it('should preserve safe HTML tags', () => {
      expect(sanitizeHtml('<p>Hello World</p>')).toBe('<p>Hello World</p>');
      expect(sanitizeHtml('<strong>Bold</strong>')).toBe('<strong>Bold</strong>');
      expect(sanitizeHtml('<em>Italic</em>')).toBe('<em>Italic</em>');
    });

    it('should remove script tags', () => {
      expect(sanitizeHtml('<p>Hello</p><script>alert("xss")</script>')).toBe('<p>Hello</p>');
      expect(sanitizeHtml('<script>malicious()</script>')).toBe('');
    });

    it('should remove inline event handlers', () => {
      expect(sanitizeHtml('<p onclick="alert()">Click</p>')).toBe('<p>Click</p>');
      expect(sanitizeHtml('<a href="#" onmouseover="alert()">Link</a>')).toBe('<a href="#">Link</a>');
    });

    it('should remove javascript: protocol from links', () => {
      expect(sanitizeHtml('<a href="javascript:alert()">Click</a>')).toBe('<a>Click</a>');
    });

    it('should preserve safe link attributes', () => {
      const input = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>';
      const result = sanitizeHtml(input);
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('target="_blank"');
    });

    it('should preserve image tags with safe attributes', () => {
      const input = '<img src="image.jpg" alt="Description" title="Title">';
      const result = sanitizeHtml(input);
      expect(result).toContain('src="image.jpg"');
      expect(result).toContain('alt="Description"');
    });

    it('should remove data attributes', () => {
      expect(sanitizeHtml('<p data-id="123">Text</p>')).toBe('<p>Text</p>');
    });

    it('should preserve headings', () => {
      expect(sanitizeHtml('<h1>Title</h1>')).toBe('<h1>Title</h1>');
      expect(sanitizeHtml('<h2>Subtitle</h2>')).toBe('<h2>Subtitle</h2>');
    });

    it('should preserve lists', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      expect(sanitizeHtml(input)).toBe(input);
    });

    it('should preserve code blocks', () => {
      expect(sanitizeHtml('<code>const x = 1;</code>')).toBe('<code>const x = 1;</code>');
      expect(sanitizeHtml('<pre>code block</pre>')).toBe('<pre>code block</pre>');
    });

    it('should preserve tables', () => {
      const input = '<table><thead><tr><th>Header</th></tr></thead><tbody><tr><td>Data</td></tr></tbody></table>';
      expect(sanitizeHtml(input)).toBe(input);
    });

    it('should handle empty strings', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('should handle plain text without HTML', () => {
      expect(sanitizeHtml('Plain text')).toBe('Plain text');
    });
  });

  describe('Property Tests', () => {
    /**
     * Property 2: HTML sanitization safety (Validates Requirements 19.5, 20.6)
     * For any HTML string, sanitizeHtml should remove all script tags and dangerous attributes
     */
    it('should never contain script tags in output', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string(),
          (before, after) => {
            const maliciousHtml = `${before}<script>alert("xss")</script>${after}`;
            const result = sanitizeHtml(maliciousHtml);
            expect(result.toLowerCase()).not.toContain('<script');
            expect(result.toLowerCase()).not.toContain('</script>');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 3: Event handler removal
     * For any HTML with event handlers, they should be removed
     */
    it('should remove all event handler attributes', () => {
      const eventHandlers = [
        'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
        'onfocus', 'onblur', 'onchange', 'onsubmit', 'onkeydown'
      ];

      fc.assert(
        fc.property(
          fc.constantFrom(...eventHandlers),
          fc.string(),
          (handler, code) => {
            const maliciousHtml = `<p ${handler}="${code}">Text</p>`;
            const result = sanitizeHtml(maliciousHtml);
            expect(result.toLowerCase()).not.toContain(handler);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4: JavaScript protocol removal
     * For any link with javascript: protocol, it should be removed
     */
    it('should remove javascript: protocol from links', () => {
      fc.assert(
        fc.property(fc.string(), (code) => {
          const maliciousHtml = `<a href="javascript:${code}">Link</a>`;
          const result = sanitizeHtml(maliciousHtml);
          expect(result.toLowerCase()).not.toContain('javascript:');
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 5: Data attribute removal
     * For any HTML with data attributes, they should be removed
     */
    it('should remove all data attributes', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string(),
          (attrName, value) => {
            const html = `<p data-${attrName}="${value}">Text</p>`;
            const result = sanitizeHtml(html);
            expect(result.toLowerCase()).not.toContain(`data-${attrName}`);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 6: Idempotence
     * Sanitizing already sanitized HTML should not change it
     */
    it('should be idempotent for safe HTML', () => {
      const safeHtmlExamples = [
        '<p>Text</p>',
        '<strong>Bold</strong>',
        '<a href="https://example.com">Link</a>',
        '<ul><li>Item</li></ul>',
      ];

      fc.assert(
        fc.property(fc.constantFrom(...safeHtmlExamples), (html) => {
          const once = sanitizeHtml(html);
          const twice = sanitizeHtml(once);
          expect(twice).toBe(once);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 7: Output is valid HTML structure
     * The output should not contain malformed HTML patterns
     */
    it('should produce well-formed HTML', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = sanitizeHtml(input);
          // Verify no obvious malformation patterns
          // Note: >> or << can appear in plain text, so we check for tag-like patterns
          expect(result).not.toContain('<<<');
          expect(result).not.toContain('>>>');
          expect(result).not.toMatch(/<[^>]*<[^>]*>/); // No nested angle brackets in tags
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 8: XSS vector prevention
     * Common XSS attack vectors should be neutralized
     */
    it('should neutralize common XSS vectors', () => {
      const xssVectors = [
        '<img src=x onerror=alert(1)>',
        '<svg onload=alert(1)>',
        '<iframe src="javascript:alert(1)">',
        '<object data="javascript:alert(1)">',
        '<embed src="javascript:alert(1)">',
        '<body onload=alert(1)>',
        '<input onfocus=alert(1) autofocus>',
        '<select onfocus=alert(1) autofocus>',
        '<textarea onfocus=alert(1) autofocus>',
        '<marquee onstart=alert(1)>',
      ];

      xssVectors.forEach((vector) => {
        const result = sanitizeHtml(vector);
        // Should not contain the dangerous parts
        expect(result.toLowerCase()).not.toContain('onerror');
        expect(result.toLowerCase()).not.toContain('onload');
        expect(result.toLowerCase()).not.toContain('onfocus');
        expect(result.toLowerCase()).not.toContain('onstart');
        expect(result.toLowerCase()).not.toContain('javascript:');
      });
    });
  });
});

describe('stripHtml', () => {
  describe('Unit Tests - Specific Examples', () => {
    it('should remove all HTML tags', () => {
      expect(stripHtml('<p>Hello World</p>')).toBe('Hello World');
      expect(stripHtml('<strong>Bold</strong>')).toBe('Bold');
    });

    it('should handle nested tags', () => {
      expect(stripHtml('<p>Hello <strong>World</strong></p>')).toBe('Hello World');
    });

    it('should handle multiple tags', () => {
      expect(stripHtml('<h1>Title</h1><p>Content</p>')).toBe('TitleContent');
    });

    it('should handle empty strings', () => {
      expect(stripHtml('')).toBe('');
    });

    it('should handle plain text', () => {
      expect(stripHtml('Plain text')).toBe('Plain text');
    });

    it('should remove script tags and their content', () => {
      expect(stripHtml('<script>alert("xss")</script>Text')).toBe('Text');
    });
  });

  describe('Property Tests', () => {
    /**
     * Property 1: No HTML tags in output
     * For any input, the output should not contain < or > characters
     */
    it('should never contain HTML tags in output', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = stripHtml(input);
          // After stripping, there should be no < or > unless they were escaped
          const tagPattern = /<[^>]+>/;
          expect(tagPattern.test(result)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2: Idempotence
     * Stripping HTML twice should give the same result as once
     */
    it('should be idempotent', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const once = stripHtml(input);
          const twice = stripHtml(once);
          expect(twice).toBe(once);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 3: Length constraint
     * Stripping HTML should generally not significantly increase string length
     * Note: DOMPurify may convert some characters to HTML entities, which can increase length
     * For example, '<' becomes '&lt;' (4 chars), so we allow reasonable expansion
     */
    it('should not significantly increase string length', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = stripHtml(input);
          // Allow up to 4x expansion for entity encoding (e.g., '<' -> '&lt;')
          // This is a reasonable upper bound for HTML entity conversion
          expect(result.length).toBeLessThanOrEqual(input.length * 4);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4: Plain text should be unchanged
     * If input contains no HTML tags, output should be identical
     */
    it('should not modify plain text without HTML', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !s.includes('<') && !s.includes('>')),
          (plainText) => {
            const result = stripHtml(plainText);
            expect(result).toBe(plainText);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('truncateHtml', () => {
  describe('Unit Tests - Specific Examples', () => {
    it('should truncate long text', () => {
      expect(truncateHtml('<p>This is a long article</p>', 10)).toBe('This is a ...');
    });

    it('should not truncate short text', () => {
      expect(truncateHtml('<p>Short</p>', 100)).toBe('Short');
    });

    it('should handle exact length', () => {
      expect(truncateHtml('<p>Exact</p>', 5)).toBe('Exact');
    });

    it('should strip HTML before truncating', () => {
      const result = truncateHtml('<p>Hello <strong>World</strong></p>', 8);
      expect(result).toBe('Hello Wo...');
    });

    it('should handle empty strings', () => {
      expect(truncateHtml('', 10)).toBe('');
    });

    it('should handle zero max length', () => {
      expect(truncateHtml('<p>Text</p>', 0)).toBe('...');
    });
  });

  describe('Property Tests', () => {
    /**
     * Property 1: Output length constraint
     * For any input and maxLength, output should be <= maxLength + 3 (for ellipsis)
     */
    it('should respect maximum length constraint', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.integer({ min: 0, max: 100 }),
          (html, maxLength) => {
            const result = truncateHtml(html, maxLength);
            expect(result.length).toBeLessThanOrEqual(maxLength + 3); // +3 for "..."
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 2: No HTML in output
     * Output should never contain HTML tags
     */
    it('should never contain HTML tags in output', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.integer({ min: 0, max: 100 }),
          (html, maxLength) => {
            const result = truncateHtml(html, maxLength);
            const tagPattern = /<[^>]+>/;
            expect(tagPattern.test(result)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 3: Ellipsis only when truncated
     * Ellipsis should only appear when text was actually truncated
     */
    it('should only add ellipsis when text is truncated', () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 50 }),
          fc.integer({ min: 10, max: 100 }),
          (html, maxLength) => {
            const result = truncateHtml(html, maxLength);
            const plainText = stripHtml(html);
            
            if (plainText.length <= maxLength) {
              expect(result).not.toContain('...');
            } else {
              expect(result).toContain('...');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * Property 4: Consistency with stripHtml
     * truncateHtml should produce same result as stripHtml + truncate
     */
    it('should be consistent with stripHtml', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.integer({ min: 5, max: 50 }),
          (html, maxLength) => {
            const result = truncateHtml(html, maxLength);
            const stripped = stripHtml(html);
            
            if (stripped.length <= maxLength) {
              expect(result).toBe(stripped);
            } else {
              expect(result).toBe(stripped.substring(0, maxLength) + '...');
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
