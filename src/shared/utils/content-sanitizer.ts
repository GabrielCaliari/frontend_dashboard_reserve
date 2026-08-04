/**
 * Content Sanitizer Utility
 * 
 * Provides HTML sanitization functions to prevent XSS attacks.
 * Uses DOMPurify to clean HTML content while preserving safe formatting.
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML content to prevent XSS attacks.
 * 
 * Allows a safe subset of HTML tags and attributes commonly used in articles:
 * - Text formatting: p, br, strong, em, u, s
 * - Links: a (with href, target, rel)
 * - Lists: ul, ol, li
 * - Headings: h1-h6
 * - Code: code, pre, blockquote
 * - Media: img (with src, alt, title)
 * - Tables: table, thead, tbody, tr, th, td
 * 
 * Removes all script tags, event handlers, and dangerous attributes.
 * 
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML safe for rendering
 * 
 * @example
 * sanitizeHtml('<p>Hello</p><script>alert("xss")</script>') 
 * // Returns: '<p>Hello</p>'
 * 
 * sanitizeHtml('<a href="javascript:alert()">Click</a>')
 * // Returns: '<a>Click</a>'
 */
export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre',
      'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'src', 'alt', 'title', 'class',
    ],
    ALLOW_DATA_ATTR: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
  });
};

/**
 * Strips all HTML tags from content, returning plain text.
 * 
 * Useful for creating text excerpts, meta descriptions, or search indexing.
 * 
 * @param html - The HTML string to strip
 * @returns Plain text with all HTML tags removed
 * 
 * @example
 * stripHtml('<p>Hello <strong>World</strong></p>') 
 * // Returns: 'Hello World'
 * 
 * stripHtml('<h1>Title</h1><p>Content</p>')
 * // Returns: 'TitleContent'
 */
export const stripHtml = (html: string): string => {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
};

/**
 * Truncates HTML content to a maximum length, preserving plain text.
 * 
 * First strips all HTML tags, then truncates to the specified length.
 * Adds ellipsis (...) if content was truncated.
 * 
 * @param html - The HTML string to truncate
 * @param maxLength - Maximum length of the resulting text
 * @returns Truncated plain text with ellipsis if needed
 * 
 * @example
 * truncateHtml('<p>This is a long article</p>', 10)
 * // Returns: 'This is a ...'
 * 
 * truncateHtml('<p>Short</p>', 100)
 * // Returns: 'Short'
 */
export const truncateHtml = (html: string, maxLength: number): string => {
  const text = stripHtml(html);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
