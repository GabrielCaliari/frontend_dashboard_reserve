# Requirements Document: CMS Blog and Articles Integration

## Introduction

This document specifies the requirements for implementing a comprehensive Content Management System (CMS) for blogs and articles within the RESERVE Admin Dashboard. The system provides two distinct access layers: a public API for frontend consumption using blog secret keys, and an administrative layer for full CMS management using JWT authentication with role-based access control.

The CMS enables administrators to create and manage multiple blogs, each containing articles with rich content and images. The system supports complete content lifecycle management including drafting, publishing, archiving, and reordering of articles.

## Glossary

- **CMS**: Content Management System - the blog and article management system
- **Blog**: A container for articles with its own authentication credentials
- **Article**: Individual content piece within a blog (can be draft, published, or archived)
- **Article_Image**: Image associated with an article with ordering capability
- **Tenant**: Organization or account that owns blogs and articles
- **Secret_Key**: Cryptographically secure key for public API authentication
- **Slug**: URL-friendly unique identifier derived from title
- **Display_Order**: Numeric field controlling the order of items in lists
- **RBAC**: Role-Based Access Control with four levels (viewer, editor, manager, owner)
- **Public_API**: Endpoints accessible with blog secret key for frontend consumption
- **Admin_API**: Endpoints requiring JWT authentication for CMS management
- **API_Client**: HTTP client configured with authentication headers
- **Query_Hook**: React hook managing asynchronous data fetching with TanStack Query
- **Query_Function**: Function encapsulating a specific API endpoint call

## Requirements

### Requirement 1: Public API - Article Listing

**User Story:** As a frontend developer, I want to fetch paginated published articles from a blog, so that I can display them on the public website.

#### Acceptance Criteria

1. WHEN the Public_API receives a request with valid Secret_Key, THE CMS SHALL return only articles with status "published"
2. WHEN pagination parameters are provided (page, limit), THE CMS SHALL return articles in pages with maximum 50 items per page
3. THE CMS SHALL order returned articles by display_order in ascending order
4. WHEN returning articles, THE CMS SHALL include all associated Article_Images ordered by their display_order
5. THE CMS SHALL return pagination metadata including current page, total pages, and total records
6. WHEN no pagination parameters are provided, THE CMS SHALL default to page 1 with 10 items per page

### Requirement 2: Public API - Article Detail by Slug

**User Story:** As a frontend developer, I want to fetch a specific article by its slug, so that I can display the full article content on a dedicated page.

#### Acceptance Criteria

1. WHEN the Public_API receives a slug with valid Secret_Key, THE CMS SHALL return the article if it exists and is published
2. THE CMS SHALL validate that the article belongs to the blog identified by the Secret_Key
3. IF the article does not exist or is not published, THEN THE CMS SHALL return a 404 error
4. WHEN returning an article, THE CMS SHALL include complete metadata (id, title, slug, status, content, timestamps)
5. WHEN returning an article, THE CMS SHALL include all associated Article_Images ordered by display_order
6. THE CMS SHALL include published_at, created_at, and updated_at timestamps for caching and history

### Requirement 3: Admin API - Blog Creation

**User Story:** As an administrator with manager role, I want to create a new blog, so that I can organize content for different purposes or audiences.

#### Acceptance Criteria

1. WHEN an administrator with manager or owner role creates a blog, THE CMS SHALL generate a unique slug from the blog name
2. WHEN creating a blog, THE CMS SHALL generate a cryptographically secure Secret_Key
3. THE CMS SHALL associate the new blog with the authenticated administrator's Tenant
4. THE CMS SHALL validate that the slug is unique within the Tenant
5. THE CMS SHALL accept a name (maximum 150 characters) and optional description
6. WHEN the blog is created, THE CMS SHALL return the blog data including the generated Secret_Key

### Requirement 4: Admin API - Blog Management

**User Story:** As an administrator, I want to list, update, and delete blogs, so that I can manage my organization's content structure.

#### Acceptance Criteria

1. WHEN an administrator with viewer role or higher requests blogs, THE CMS SHALL return all blogs belonging to their Tenant
2. WHEN an administrator with editor role or higher updates a blog, THE CMS SHALL modify only the provided fields (name, description)
3. WHEN an administrator with manager role or higher deletes a blog, THE CMS SHALL remove the blog and cascade delete all associated articles and images
4. THE CMS SHALL validate that the blog belongs to the administrator's Tenant before any modification
5. WHEN updating a blog, THE CMS SHALL NOT allow modification of the Secret_Key through the update endpoint

### Requirement 5: Admin API - Secret Key Regeneration

**User Story:** As an administrator with owner role, I want to regenerate a blog's secret key, so that I can revoke compromised credentials or rotate keys periodically.

#### Acceptance Criteria

1. WHEN an administrator with owner role requests key regeneration, THE CMS SHALL generate a new cryptographically secure Secret_Key
2. WHEN a new key is generated, THE CMS SHALL immediately invalidate the previous Secret_Key
3. THE CMS SHALL return the new Secret_Key in the response as the only opportunity for viewing
4. THE CMS SHALL validate that the blog belongs to the administrator's Tenant

### Requirement 6: Admin API - Article Creation

**User Story:** As an administrator with editor role, I want to create a new article, so that I can draft content before publishing.

#### Acceptance Criteria

1. WHEN an administrator with editor role or higher creates an article, THE CMS SHALL generate a unique slug from the article title
2. THE CMS SHALL create the article with status "draft" by default
3. THE CMS SHALL associate the article with the specified blog
4. THE CMS SHALL set display_order automatically to position the article last in the list
5. THE CMS SHALL NOT set published_at until the article transitions to "published" status
6. THE CMS SHALL accept a title (maximum 255 characters) and content (HTML or Markdown)

### Requirement 7: Admin API - Article Listing and Retrieval

**User Story:** As an administrator, I want to list and view articles with filtering options, so that I can manage content effectively.

#### Acceptance Criteria

1. WHEN an administrator with viewer role or higher requests articles, THE CMS SHALL return all articles for the specified blog
2. WHEN a status filter is provided (draft, published, archived), THE CMS SHALL return only articles matching that status
3. WHEN no status filter is provided, THE CMS SHALL return articles in all statuses
4. THE CMS SHALL order articles by display_order in ascending order
5. WHEN retrieving a specific article by ID, THE CMS SHALL include all associated Article_Images
6. THE CMS SHALL validate that the article belongs to the specified blog

### Requirement 8: Admin API - Article Updates

**User Story:** As an administrator with editor role, I want to update article content, so that I can correct errors or refresh outdated information.

#### Acceptance Criteria

1. WHEN an administrator with editor role or higher updates an article, THE CMS SHALL modify only the provided fields (title, content)
2. THE CMS SHALL NOT alter the article status during content updates
3. THE CMS SHALL automatically update the updated_at timestamp
4. THE CMS SHALL maintain the original slug without regeneration
5. THE CMS SHALL validate that the article belongs to the specified blog and the administrator's Tenant

### Requirement 9: Admin API - Article Deletion

**User Story:** As an administrator with editor role, I want to delete articles, so that I can remove obsolete or unwanted content.

#### Acceptance Criteria

1. WHEN an administrator with editor role or higher deletes an article, THE CMS SHALL remove the article from the database
2. THE CMS SHALL cascade delete all associated Article_Images
3. THE CMS SHALL remove physical image files from storage (S3)
4. THE CMS SHALL validate that the article belongs to the specified blog and the administrator's Tenant

### Requirement 10: Admin API - Article Status Transitions

**User Story:** As an administrator with editor role, I want to publish and archive articles, so that I can control content visibility.

#### Acceptance Criteria

1. WHEN an administrator publishes an article, THE CMS SHALL validate that the article is in "draft" status
2. WHEN publishing an article, THE CMS SHALL change status to "published" and set published_at to current timestamp
3. IF an article is not in draft status when publishing, THEN THE CMS SHALL return a 409 conflict error
4. WHEN an administrator archives an article, THE CMS SHALL validate that the article is in "published" status
5. WHEN archiving an article, THE CMS SHALL change status to "archived" and maintain the original published_at
6. IF an article is not in published status when archiving, THEN THE CMS SHALL return a 409 conflict error

### Requirement 11: Admin API - Article Reordering

**User Story:** As an administrator with editor role, I want to reorder articles, so that I can control the display sequence on the public website.

#### Acceptance Criteria

1. WHEN an administrator provides an array of article IDs with new display_order values, THE CMS SHALL update all articles in a single transaction
2. THE CMS SHALL validate that all article IDs belong to the specified blog
3. THE CMS SHALL NOT validate uniqueness or sequence of display_order numbers (gaps are allowed)
4. THE CMS SHALL validate that the blog belongs to the administrator's Tenant

### Requirement 12: Admin API - Image Management

**User Story:** As an administrator with editor role, I want to upload and manage article images, so that I can enhance content with visual elements.

#### Acceptance Criteria

1. WHEN an administrator uploads images to an article, THE CMS SHALL store images in S3 storage
2. THE CMS SHALL associate each image with the article and generate a complete URL
3. WHEN creating Article_Images, THE CMS SHALL accept alt_text for accessibility
4. THE CMS SHALL support reordering of images through display_order updates
5. WHEN deleting an article, THE CMS SHALL remove all associated image files from storage
6. THE CMS SHALL validate that the article belongs to the administrator's Tenant

### Requirement 13: Frontend - API Client Configuration

**User Story:** As a developer, I want configured API clients for both public and admin endpoints, so that I can make authenticated requests easily.

#### Acceptance Criteria

1. THE API_Client for public endpoints SHALL include the blog Secret_Key in request headers
2. THE API_Client for admin endpoints SHALL include JWT token from cookies in Authorization header
3. THE API_Client for admin endpoints SHALL include tenant ID from localStorage in x-tenant-id header
4. THE API_Client SHALL configure base URL from environment variables
5. THE API_Client SHALL handle 401 responses by clearing authentication and redirecting to login

### Requirement 14: Frontend - Query Functions Layer

**User Story:** As a developer, I want query functions that encapsulate API calls, so that I can reuse HTTP logic across components.

#### Acceptance Criteria

1. FOR ALL public and admin endpoints, THE CMS SHALL provide a corresponding Query_Function
2. WHEN a Query_Function is called, THE CMS SHALL transform input parameters into appropriate query strings or request body
3. THE Query_Function SHALL return typed response data matching the API contract
4. THE Query_Function SHALL handle pagination parameters for list endpoints
5. THE Query_Function SHALL handle error responses and throw typed errors

### Requirement 15: Frontend - React Query Hooks

**User Story:** As a developer, I want React Query hooks for data fetching, so that I can manage loading states and caching automatically.

#### Acceptance Criteria

1. FOR ALL Query_Functions, THE CMS SHALL provide a corresponding Query_Hook using TanStack Query
2. THE Query_Hook SHALL expose loading, error, and data states
3. THE Query_Hook SHALL configure appropriate cache keys for query invalidation
4. THE Query_Hook SHALL configure staleTime of at least 5 minutes for public article data
5. THE Query_Hook SHALL support pagination and infinite scroll patterns where applicable
6. THE Query_Hook SHALL configure minimum 100 iterations for property-based tests

### Requirement 16: Frontend - Blog Management Dashboard

**User Story:** As an administrator, I want a dashboard to manage blogs, so that I can create, edit, and configure blog settings.

#### Acceptance Criteria

1. WHEN an administrator accesses the blog management dashboard, THE CMS SHALL display all blogs for their Tenant
2. THE CMS SHALL provide UI controls to create a new blog with name and description
3. WHEN a blog is created, THE CMS SHALL display the Secret_Key with copy-to-clipboard functionality
4. THE CMS SHALL provide UI controls to edit blog name and description
5. THE CMS SHALL provide UI controls to regenerate Secret_Key with confirmation dialog
6. THE CMS SHALL provide UI controls to delete a blog with double confirmation
7. THE CMS SHALL display blog statistics including article counts by status

### Requirement 17: Frontend - Article Management Dashboard

**User Story:** As an administrator, I want a dashboard to manage articles, so that I can create, edit, and organize content.

#### Acceptance Criteria

1. WHEN an administrator accesses the article management dashboard, THE CMS SHALL display articles for the selected blog
2. THE CMS SHALL provide filter tabs for draft, published, archived, and all articles
3. THE CMS SHALL provide UI controls to create a new article with title and content
4. THE CMS SHALL provide a rich text editor for article content supporting HTML or Markdown
5. THE CMS SHALL provide drag-and-drop functionality to reorder articles
6. THE CMS SHALL provide UI controls to publish, archive, and delete articles with appropriate confirmations
7. THE CMS SHALL display article status with visual indicators

### Requirement 18: Frontend - Article Editor

**User Story:** As an administrator, I want a comprehensive article editor, so that I can create rich content with images.

#### Acceptance Criteria

1. WHEN an administrator edits an article, THE CMS SHALL provide a title input with automatic slug generation preview
2. THE CMS SHALL provide a rich text editor with formatting controls
3. THE CMS SHALL provide image upload functionality with drag-and-drop support
4. THE CMS SHALL display uploaded images with reordering capability
5. THE CMS SHALL provide alt text editing for each image
6. THE CMS SHALL provide a preview pane showing how the article will appear publicly
7. THE CMS SHALL auto-save drafts periodically to prevent data loss

### Requirement 19: Frontend - Public Blog Pages

**User Story:** As a website visitor, I want to view published blog articles, so that I can read content.

#### Acceptance Criteria

1. WHEN a visitor accesses the blog listing page, THE CMS SHALL display published articles in order
2. THE CMS SHALL provide pagination controls for navigating through articles
3. WHEN a visitor clicks an article, THE CMS SHALL navigate to the article detail page using the slug
4. WHEN displaying an article, THE CMS SHALL render the title, content, publication date, and images
5. THE CMS SHALL sanitize HTML content to prevent XSS attacks
6. THE CMS SHALL optimize images using Next.js Image component

### Requirement 20: Data Validation and Security

**User Story:** As a system administrator, I want robust validation and security, so that the system is protected from attacks and data corruption.

#### Acceptance Criteria

1. THE CMS SHALL validate all input data using Zod schemas before processing
2. THE CMS SHALL enforce maximum length constraints (blog name 150 chars, article title 255 chars)
3. THE CMS SHALL validate that Secret_Keys are cryptographically secure (minimum 32 characters)
4. THE CMS SHALL enforce Tenant isolation ensuring administrators cannot access other tenants' data
5. THE CMS SHALL validate RBAC permissions before executing any administrative action
6. THE CMS SHALL sanitize HTML content on the frontend before rendering to prevent XSS
7. THE CMS SHALL validate file types and sizes for image uploads

### Requirement 21: Parser and Serializer for Article Content

**User Story:** As a developer, I want reliable content parsing and serialization, so that article content maintains integrity through save and load cycles.

#### Acceptance Criteria

1. WHEN article content is saved, THE CMS SHALL serialize the content to a storable format
2. WHEN article content is loaded, THE CMS SHALL parse the stored format back to editable content
3. THE CMS SHALL support both HTML and Markdown content formats
4. FOR ALL valid article content, parsing then serializing then parsing SHALL produce equivalent content (round-trip property)
5. WHEN invalid content is provided, THE CMS SHALL return descriptive error messages

### Requirement 22: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages and feedback, so that I understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN an API error occurs, THE CMS SHALL display user-friendly error messages
2. WHEN a validation error occurs, THE CMS SHALL highlight the specific fields with problems
3. WHEN a network error occurs, THE CMS SHALL provide retry functionality
4. WHEN a successful action completes, THE CMS SHALL display confirmation feedback
5. WHEN a long-running operation is in progress, THE CMS SHALL display loading indicators
6. IF a 409 conflict error occurs during status transition, THEN THE CMS SHALL explain the current state and valid transitions
