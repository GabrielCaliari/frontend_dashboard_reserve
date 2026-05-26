# Implementation Plan: CMS Blog and Articles Integration

## Overview

This implementation plan breaks down the CMS Blog and Articles Integration feature into logical, sequential tasks. The system provides a dual-layer architecture with public API endpoints for frontend consumption and administrative endpoints for full CMS management.

The implementation follows a layered approach:
1. HTTP Client Layer (API clients with authentication)
2. Service Layer (query functions encapsulating API calls)
3. React Query Hooks Layer (state management with TanStack Query)
4. Presentation Layer (UI components and pages)

Each layer builds upon the previous, ensuring incremental progress with testable milestones.

## Tasks

- [x] 1. Set up project structure and type definitions
  - Create directory structure for CMS feature
  - Define TypeScript types for Blog, Article, and ArticleImage entities
  - Define DTO types for create/update operations
  - Create validation schemas using Zod for all entities
  - _Requirements: 20.1, 20.2_

- [x] 2. Implement HTTP client layer
  - [x] 2.1 Create CMS Admin API client
    - Configure axios instance with base URL from environment variables
    - Implement request interceptor to add JWT token from cookies
    - Implement request interceptor to add tenant ID from localStorage
    - Implement response interceptor to handle 401 errors with redirect
    - _Requirements: 13.2, 13.3, 13.5_
  
  - [x] 2.2 Create CMS Public API client factory
    - Implement factory function that accepts blog secret key
    - Configure axios instance with public API base URL
    - Add secret key to request headers
    - _Requirements: 13.1, 13.4_

- [x] 3. Implement service layer - Blog operations
  - [x] 3.1 Create blog service with query functions
    - Implement fetchBlogs() for listing all blogs
    - Implement fetchBlogById(blogId) for single blog retrieval
    - Implement createBlog(data) for blog creation
    - Implement updateBlog(blogId, data) for blog updates
    - Implement deleteBlog(blogId) for blog deletion
    - Implement regenerateBlogSecretKey(blogId) for key regeneration
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3_
  
  - [x] 3.2 Write unit tests for blog service
    - Test successful blog creation with valid data
    - Test blog update with partial data
    - Test error handling for invalid blog IDs
    - Test secret key regeneration response format
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4. Implement service layer - Article operations
  - [x] 4.1 Create article service with query functions
    - Implement fetchArticles(blogId, status?) for listing articles with optional filter
    - Implement fetchArticleById(blogId, articleId) for single article retrieval
    - Implement createArticle(blogId, data) for article creation
    - Implement updateArticle(blogId, articleId, data) for article updates
    - Implement deleteArticle(blogId, articleId) for article deletion
    - Implement publishArticle(blogId, articleId) for publishing
    - Implement archiveArticle(blogId, articleId) for archiving
    - Implement reorderArticles(blogId, order) for reordering
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 9.1, 9.2, 9.3, 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3_
  
  - [x] 4.2 Write unit tests for article service
    - Test article creation with default draft status
    - Test article status transitions (draft → published → archived)
    - Test article filtering by status
    - Test reordering with multiple articles
    - Test error handling for invalid status transitions
    - _Requirements: 6.2, 7.2, 10.1, 10.2, 10.4, 10.5, 11.1_

- [x] 5. Implement service layer - Public API operations
  - [x] 5.1 Create public CMS service with query functions
    - Implement fetchPublicArticles(secretKey, page, limit) for paginated article listing
    - Implement fetchPublicArticleBySlug(secretKey, slug) for article detail
    - Handle pagination parameters with defaults (page=1, limit=10)
    - Transform API responses to include pagination metadata
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [x] 5.2 Write unit tests for public service
    - Test pagination with various page and limit values
    - Test default pagination parameters
    - Test article filtering (only published articles returned)
    - Test 404 handling for non-existent slugs
    - _Requirements: 1.1, 1.6, 2.3_

- [x] 6. Implement utility functions
  - [x] 6.1 Create slug generator utility
    - Implement generateSlug(text) to create URL-friendly slugs
    - Implement ensureUniqueSlug(baseSlug, existingSlugs) for uniqueness
    - Handle special characters, spaces, and edge cases
    - _Requirements: 3.1, 6.1_
  
  - [x] 6.2 Create content sanitizer utility
    - Implement sanitizeHtml(html) using DOMPurify
    - Configure allowed tags and attributes for security
    - Implement stripHtml(html) for plain text extraction
    - Implement truncateHtml(html, maxLength) for previews
    - _Requirements: 19.5, 20.6_
  
  - [x] 6.3 Write property tests for slug generator
    - **Property 1: Slug uniqueness preservation**
    - *For any* base slug and list of existing slugs, ensureUniqueSlug should return a slug not in the existing list
    - **Validates: Requirements 3.4**
  
  - [x] 6.4 Write property tests for content sanitizer
    - **Property 2: HTML sanitization safety**
    - *For any* HTML string, sanitizeHtml should remove all script tags and dangerous attributes
    - **Validates: Requirements 19.5, 20.6**

- [x] 7. Checkpoint - Verify service layer
  - Ensure all service functions are implemented and tested
  - Verify API client configuration works correctly
  - Ask the user if questions arise

- [x] 8. Implement React Query hooks - Blog hooks
  - [x] 8.1 Create blog query hooks
    - Implement useBlogs() hook with query key and fetch function
    - Implement useBlog(blogId) hook for single blog
    - Configure staleTime to 5 minutes for caching
    - Define BLOG_QUERY_KEYS constant for cache management
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [x] 8.2 Create blog mutation hooks
    - Implement useCreateBlog() with cache invalidation
    - Implement useUpdateBlog() with optimistic updates
    - Implement useDeleteBlog() with cache invalidation
    - Implement useRegenerateBlogKey() with cache invalidation
    - Configure onSuccess callbacks to invalidate relevant queries
    - _Requirements: 15.1, 15.2, 15.3_

- [x] 9. Implement React Query hooks - Article hooks
  - [x] 9.1 Create article query hooks
    - Implement useArticles(blogId, status?) with filtering support
    - Implement useArticle(blogId, articleId) for single article
    - Configure staleTime to 2 minutes for admin content
    - Define ARTICLE_QUERY_KEYS with support for filtered queries
    - _Requirements: 15.1, 15.2, 15.3, 15.4_
  
  - [x] 9.2 Create article mutation hooks
    - Implement useCreateArticle() with cache invalidation
    - Implement useUpdateArticle() with optimistic updates
    - Implement useDeleteArticle() with cache invalidation
    - Implement usePublishArticle() with status validation
    - Implement useArchiveArticle() with status validation
    - Implement useReorderArticles() with optimistic reordering
    - Configure appropriate cache invalidation for each mutation
    - _Requirements: 15.1, 15.2, 15.3_

- [x] 10. Implement React Query hooks - Public article hooks
  - [x] 10.1 Create public article query hooks
    - Implement usePublicArticles(secretKey, page, limit) with pagination
    - Implement usePublicArticleBySlug(secretKey, slug) for detail view
    - Configure staleTime to 10 minutes for public content
    - Define PUBLIC_ARTICLE_QUERY_KEYS with pagination parameters
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [x] 11. Implement React Query hooks - Image mutation hooks
  - [x] 11.1 Create image mutation hooks
    - Implement useUploadImages() for multiple image upload
    - Implement useUpdateImage() for alt text and order updates
    - Implement useDeleteImage() with S3 cleanup
    - Implement useReorderImages() with optimistic updates
    - Configure cache invalidation to refresh article data
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 12. Checkpoint - Verify hooks layer
  - Ensure all hooks are implemented with proper cache management
  - Verify optimistic updates work correctly
  - Test cache invalidation patterns
  - Ask the user if questions arise

- [x] 13. Implement blog management components
  - [x] 13.1 Create BlogList component
    - Display grid of blog cards with loading states
    - Implement create new blog button
    - Handle empty state when no blogs exist
    - Pass action handlers to child components
    - _Requirements: 16.1, 16.2_
  
  - [x] 13.2 Create BlogCard component
    - Display blog name, description, and slug
    - Show article count statistics by status
    - Implement action menu (edit, delete, regenerate key, view articles)
    - Display secret key with copy-to-clipboard functionality
    - _Requirements: 16.1, 16.3, 16.7_
  
  - [x] 13.3 Create BlogForm component
    - Implement name input with 150 character limit
    - Implement description textarea with 500 character limit
    - Integrate Zod validation with React Hook Form
    - Handle both create and edit modes
    - Display validation errors inline
    - _Requirements: 16.2, 16.4, 20.2_
  
  - [x] 13.4 Create BlogSecretKeyDisplay component
    - Display secret key with masked/unmasked toggle
    - Implement copy-to-clipboard with success feedback
    - Show warning about key security
    - _Requirements: 16.3, 16.5_
  
  - [x] 13.5 Create BlogStats component
    - Display article counts by status (draft, published, archived)
    - Show total article count
    - Implement visual indicators (badges, charts)
    - _Requirements: 16.7_

- [x] 14. Implement article management components
  - [x] 14.1 Create ArticleList component
    - Implement status filter tabs (All, Draft, Published, Archived)
    - Display article table with sortable columns
    - Implement create new article button
    - Integrate drag-and-drop reordering with @dnd-kit
    - Handle empty states for each filter
    - _Requirements: 17.1, 17.2, 17.3, 17.5_
  
  - [x] 14.2 Create ArticleTableRow component
    - Display article title, slug, and status badge
    - Show publication date and last updated timestamp
    - Implement contextual action buttons based on status
    - Add drag handle for reordering
    - _Requirements: 17.1, 17.6, 17.7_
  
  - [x] 14.3 Create ArticleStatusBadge component
    - Display visual status indicator (draft, published, archived)
    - Use color coding (gray for draft, green for published, orange for archived)
    - Show status text with icon
    - _Requirements: 17.7_
  
  - [x] 14.4 Create ArticleReorder component
    - Implement drag-and-drop functionality using @dnd-kit
    - Show visual feedback during dragging
    - Update display_order values on drop
    - Trigger reorder mutation on completion
    - _Requirements: 17.5_

- [x] 15. Implement article editor components
  - [x] 15.1 Create ArticleEditor component
    - Integrate @udecode/plate rich text editor
    - Implement formatting toolbar (bold, italic, headings, lists, links)
    - Support both HTML and Markdown content
    - Implement character count display
    - Add auto-save functionality with debounce
    - _Requirements: 17.4, 18.2, 18.7_
  
  - [x] 15.2 Create ArticleForm component
    - Implement title input with 255 character limit
    - Show slug preview with automatic generation
    - Integrate ArticleEditor for content editing
    - Integrate ImageGallery for image management
    - Implement preview pane toggle
    - Add save draft and publish buttons
    - Handle form validation with Zod
    - _Requirements: 17.3, 17.4, 18.1, 18.2, 18.3, 18.4, 18.7, 20.2_
  
  - [x] 15.3 Create ArticlePreview component
    - Render article content with sanitization
    - Display title, publication date, and metadata
    - Show images in gallery format
    - Match public article styling
    - _Requirements: 18.6_

- [x] 16. Implement image management components
  - [x] 16.1 Create ImageUpload component
    - Implement drag-and-drop zone for file upload
    - Add file input fallback for accessibility
    - Support multiple file selection
    - Show image previews before upload
    - Display upload progress indicators
    - Validate file types (JPEG, PNG, WebP) and size (max 5MB)
    - _Requirements: 12.1, 12.2, 18.3, 20.7_
  
  - [x] 16.2 Create ImageGallery component
    - Display images in responsive grid layout
    - Implement drag-and-drop reordering with @dnd-kit
    - Show image thumbnails with alt text
    - Add delete button with confirmation
    - Highlight primary/featured image
    - _Requirements: 12.4, 18.4_
  
  - [x] 16.3 Create ImageCard component
    - Display image thumbnail using Next.js Image component
    - Show alt text with inline editing capability
    - Display display_order number
    - Add delete button with confirmation dialog
    - Show drag handle for reordering
    - _Requirements: 12.3, 12.4, 18.5_

- [x] 17. Checkpoint - Verify admin components
  - Ensure all admin components render correctly
  - Test form validation and error handling
  - Verify drag-and-drop functionality
  - Test image upload and management
  - Ask the user if questions arise

- [x] 18. Implement public frontend components
  - [x] 18.1 Create PublicArticleList component
    - Display published articles in grid or list layout
    - Show article cards with title, excerpt, and featured image
    - Implement pagination controls
    - Add loading skeleton states
    - Handle empty state when no articles exist
    - _Requirements: 19.1, 19.2_
  
  - [x] 18.2 Create PublicArticleCard component
    - Display article title and slug
    - Show publication date
    - Display featured image with Next.js Image optimization
    - Show content excerpt (truncated HTML)
    - Add "Read more" link to article detail page
    - _Requirements: 19.1, 19.6_
  
  - [x] 18.3 Create PublicArticleContent component
    - Render article title and metadata
    - Display sanitized HTML content using DOMPurify
    - Show all article images in gallery format
    - Optimize images with Next.js Image component
    - Display publication date and last updated timestamp
    - Implement responsive typography
    - _Requirements: 19.4, 19.5, 19.6_

- [x] 19. Implement admin dashboard pages
  - [x] 19.1 Create blogs listing page
    - Integrate useBlogs hook for data fetching
    - Integrate blog mutation hooks for actions
    - Implement BlogList component
    - Add modals for create/edit blog forms
    - Add confirmation dialogs for delete and regenerate key
    - Handle loading and error states
    - _Requirements: 16.1, 16.2, 16.4, 16.5, 16.6_
  
  - [x] 19.2 Create blog detail page
    - Display blog information and statistics
    - Show navigation to articles management
    - Integrate useBlog hook for data fetching
    - _Requirements: 16.1, 16.7_
  
  - [x] 19.3 Create articles listing page
    - Integrate useArticles hook with status filtering
    - Integrate article mutation hooks for actions
    - Implement ArticleList component
    - Handle status filter changes
    - Add confirmation dialogs for delete, publish, archive actions
    - Handle loading and error states
    - _Requirements: 17.1, 17.2, 17.3, 17.5, 17.6_
  
  - [x] 19.4 Create article creation page
    - Integrate useCreateArticle hook
    - Implement ArticleForm in create mode
    - Handle form submission and navigation
    - Show success feedback on creation
    - _Requirements: 17.3, 17.4_
  
  - [x] 19.5 Create article edit page
    - Integrate useArticle and useUpdateArticle hooks
    - Implement ArticleForm in edit mode
    - Handle form submission with optimistic updates
    - Show success feedback on save
    - _Requirements: 17.3, 17.4, 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_
  
  - [x] 19.6 Create article preview page
    - Integrate useArticle hook
    - Implement ArticlePreview component
    - Show how article will appear publicly
    - Add "Edit" and "Back" navigation buttons
    - _Requirements: 18.6_

- [x] 20. Implement public frontend pages
  - [x] 20.1 Create public blog listing page
    - Integrate usePublicArticles hook with pagination
    - Implement PublicArticleList component
    - Handle page navigation
    - Configure blog secret key from environment variable
    - Handle loading and error states
    - _Requirements: 19.1, 19.2_
  
  - [x] 20.2 Create public article detail page
    - Integrate usePublicArticleBySlug hook
    - Implement PublicArticleContent component
    - Handle 404 errors for non-existent articles
    - Configure blog secret key from environment variable
    - Implement SEO metadata (title, description, og:image)
    - _Requirements: 19.3, 19.4, 19.5, 19.6_

- [x] 21. Implement error handling and user feedback
  - [x] 21.1 Add error handling to all API calls
    - Implement error transformation in service layer
    - Map API error codes to user-friendly messages
    - Handle network errors with retry functionality
    - _Requirements: 22.1, 22.3_
  
  - [x] 21.2 Add toast notifications for user feedback
    - Implement success toasts for create/update/delete operations
    - Implement error toasts with descriptive messages
    - Add toast for copy-to-clipboard actions
    - Configure toast duration and positioning
    - _Requirements: 22.1, 22.4_
  
  - [x] 21.3 Add loading indicators
    - Implement skeleton loaders for list views
    - Add spinner for form submissions
    - Show progress bars for image uploads
    - Add loading states to buttons during mutations
    - _Requirements: 22.5_
  
  - [x] 21.4 Add validation error display
    - Highlight form fields with validation errors
    - Display inline error messages below fields
    - Show error summary at top of forms
    - Handle 409 conflict errors with specific guidance
    - _Requirements: 22.2, 22.6_

- [x] 22. Final integration and testing
  - [x] 22.1 Wire all components together
    - Verify all pages are properly routed
    - Ensure navigation flows work correctly
    - Test authentication and authorization
    - Verify tenant isolation
    - _Requirements: 13.2, 13.3, 20.4, 20.5_
  
  - [x] 22.2 Write integration tests for critical flows
    - Test blog creation → article creation → publish flow
    - Test article reordering with multiple articles
    - Test image upload → reorder → delete flow
    - Test public API with secret key authentication
    - _Requirements: 3.1, 6.1, 10.1, 12.1_
  
  - [x] 22.3 Write property tests for data validation
    - **Property 3: Blog name length constraint**
    - *For any* blog creation request, names exceeding 150 characters should be rejected
    - **Validates: Requirements 20.2**
  
  - [x] 22.4 Write property tests for article status transitions
    - **Property 4: Valid status transition enforcement**
    - *For any* article, publishing should only succeed from draft status, and archiving should only succeed from published status
    - **Validates: Requirements 10.1, 10.3, 10.4, 10.6**
  
  - [x] 22.5 Write property tests for pagination
    - **Property 5: Pagination consistency**
    - *For any* valid page and limit parameters, the sum of items across all pages should equal total_records
    - **Validates: Requirements 1.5, 1.6**
  
  - [x] 22.6 Write property tests for content sanitization
    - **Property 6: XSS prevention**
    - *For any* HTML content containing script tags or event handlers, sanitization should remove all executable code
    - **Validates: Requirements 19.5, 20.6**
  
  - [x] 22.7 Write property tests for tenant isolation
    - **Property 7: Cross-tenant data access prevention**
    - *For any* API request, data returned should only belong to the authenticated user's tenant
    - **Validates: Requirements 20.4**

- [x] 23. Final checkpoint - Ensure all tests pass
  - Run all unit tests and property tests
  - Verify all features work end-to-end
  - Check for console errors and warnings
  - Ensure all requirements are met
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across all inputs
- Unit tests validate specific examples, edge cases, and error conditions
- The implementation follows the existing RESERVE architecture patterns
- All components use NextUI for consistent styling
- TanStack Query is configured with appropriate staleTime values for different content types
- Image uploads should be handled with proper validation and S3 integration
- Content sanitization is critical for security and must be tested thoroughly
