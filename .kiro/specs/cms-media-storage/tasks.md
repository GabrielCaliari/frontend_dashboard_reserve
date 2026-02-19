# Implementation Plan: CMS Media Storage Frontend

## Overview

This implementation plan covers the frontend UI for the CMS Media Storage feature. The backend API is already functional with Vercel Blob Storage integration. We'll build React/Next.js pages and components to interact with the existing endpoints for collections, assets, and relations management.

**Key Technologies:**
- Next.js 16.1.6 App Router with React 19.2.4
- React Query (@tanstack/react-query) for server state management
- NextUI for UI components
- react-dropzone for file uploads
- Axios via existing cms-api-client for HTTP communication
- Zod for validation schemas
- React Hook Form for form state management

---

## Tasks

- [x] 1. Setup and Dependencies
  - [x] 1.1 Install required dependencies
    - Install React Query (`@tanstack/react-query`)
    - Install react-dropzone for drag-and-drop uploads
    - Verify NextUI, Axios, Zod, React Hook Form are available
    - _Requirements: TR-2, TR-4_
  
  - [x] 1.2 Configure React Query provider
    - Add QueryClientProvider to `src/app/providers.tsx`
    - Configure query client with default options (staleTime: 60000, retry: 1)
    - Add devtools for development environment
    - _Requirements: TR-2_

- [x] 2. Type Definitions and API Service Layer
  - [x] 2.1 Create TypeScript type definitions
    - Create `src/common/@types/@cms-media.ts` with MediaCollection, MediaAsset, MediaRelation interfaces
    - Define CollectionType enum ('images' | 'documents' | 'videos' | 'mixed')
    - Define AssetStatus enum ('active' | 'archived' | 'failed')
    - Define API response types (paginated responses, error responses)
    - Define filter and pagination parameter types
    - _Requirements: Data Models section_

  - [x] 2.2 Create CMS Media API service
    - Create `src/common/services/cms-media-service.ts`
    - Implement collection CRUD methods (listCollections, getCollection, createCollection, updateCollection, deleteCollection)
    - Implement asset methods (listAssets, getAsset, uploadAsset, updateAsset, deleteAsset)
    - Implement relation methods (listRelations, attachAsset, detachAsset, reorderRelations)
    - Use existing cms-api-client from `src/common/config/` for HTTP requests
    - Handle multipart/form-data for file uploads with proper headers
    - Add proper TypeScript return types for all methods
    - _Requirements: TR-1, Backend API Status_

- [x] 3. React Query Hooks
  - [x] 3.1 Create collection hooks
    - Create `src/common/hooks/use-collections.ts`
    - Implement useCollections query (list with pagination and type filters)
    - Implement useCollection query (get single collection by ID)
    - Implement useCreateCollection mutation with cache invalidation
    - Implement useUpdateCollection mutation with optimistic updates
    - Implement useDeleteCollection mutation with cache invalidation
    - Configure staleTime: 60000ms for collection queries
    - _Requirements: US-1, TR-2_

  - [x] 3.2 Create asset hooks
    - Create `src/common/hooks/use-assets.ts`
    - Implement useAssets query (list with pagination, collection filter, status filter, search)
    - Implement useAsset query (get single asset by ID)
    - Implement useUploadAsset mutation with upload progress tracking via onUploadProgress
    - Implement useUpdateAsset mutation with optimistic updates
    - Implement useDeleteAsset mutation with cache invalidation
    - Configure staleTime: 30000ms for asset queries
    - Add proper error handling for all mutations
    - _Requirements: US-2, US-3, TR-2_

  - [x] 3.3 Create relation hooks
    - Create `src/common/hooks/use-relations.ts`
    - Implement useRelations query (list relations filtered by entity_type and entity_id)
    - Implement useAttachAsset mutation with cache invalidation
    - Implement useDetachAsset mutation with cache invalidation
    - Implement useReorderRelations mutation with optimistic updates
    - Configure cache invalidation to update both relations and asset queries
    - _Requirements: US-5, TR-2_

- [x] 4. Utility Functions and Validation Schemas
  - [x] 4.1 Create file utilities
    - Create `src/common/utils/format-file-size.ts` for human-readable file sizes (B, KB, MB, GB)
    - Create `src/common/utils/validate-file.ts` for client-side file validation
    - Create `src/common/utils/generate-preview.ts` for image preview URLs using FileReader
    - Add MIME type validation helpers and constants
    - _Requirements: TR-4, TR-7_
  
  - [x] 4.2 Create validation schemas
    - Create `src/common/schemas/cms-media-schema.ts`
    - Define Zod schema for collection creation/update (name, slug, type, allowed_mime_types, max_file_size, max_items)
    - Define Zod schema for asset metadata update (alt_text, metadata)
    - Add custom validators for MIME types and file sizes
    - _Requirements: TR-7, US-1.8_

- [x] 5. Collection Management Pages
  - [x] 5.1 Collections list page
    - Create `src/app/dashboard/cms/collections/page.tsx`
    - Display collections in NextUI Table with columns: name, type, allowed types, max size, item count
    - Add filter dropdown for collection type (images, documents, videos, mixed, all)
    - Add search input for collection name with 300ms debounce
    - Add "Create Collection" button linking to /dashboard/cms/collections/new
    - Add action buttons per row: Edit (navigate to [id]), Delete (with confirmation modal)
    - Implement pagination using NextUI Pagination component (20 items per page)
    - Show loading skeleton while fetching data
    - Display empty state when no collections exist
    - _Requirements: US-1.5, TR-3, TR-5_

  - [x] 5.2 Create collection page
    - Create `src/app/dashboard/cms/collections/new/page.tsx`
    - Create `src/components/cms/collection-form.tsx` reusable form component
    - Add form fields using NextUI components:
      - Input for name (required)
      - Textarea for description (optional)
      - Select for type (images, documents, videos, mixed)
      - Multi-select for allowed MIME types with common presets
      - Input for max file size with unit selector (KB/MB/GB)
      - Input for max items (optional, number)
    - Implement form validation using React Hook Form + Zod resolver
    - Use cms-media-schema for validation
    - Show validation errors inline
    - Add Submit and Cancel buttons
    - Show loading state during submission
    - Redirect to collections list on success
    - Display error toast on failure
    - _Requirements: US-1.1, US-1.2, US-1.3, US-1.4, TR-3_

  - [x] 5.3 Edit collection page
    - Create `src/app/dashboard/cms/collections/[id]/page.tsx`
    - Reuse collection-form component with isEdit prop
    - Fetch collection data using useCollection hook
    - Pre-populate form with existing collection data
    - Add "Delete Collection" button with confirmation modal
    - Handle slug uniqueness validation (show error if slug exists)
    - Update collection using useUpdateCollection mutation
    - Show success toast on update
    - Redirect to collections list after delete
    - _Requirements: US-1.6, US-1.7, US-1.8, TR-3_

- [x] 6. Asset Management Pages
  - [x] 6.1 Assets list page
    - Create `src/app/dashboard/cms/media/page.tsx`
    - Display assets using asset-grid component
    - Add NextUI Select for collection filter (show all collections + "All Collections" option)
    - Add NextUI Select for status filter (active, archived, failed, all)
    - Add NextUI Input for search by filename with 300ms debounce using lodash.debounce
    - Add "Upload Assets" button linking to /dashboard/cms/media/upload
    - Implement pagination using NextUI Pagination (20 items per page default)
    - Show loading skeleton while fetching
    - Display empty state with illustration when no assets
    - _Requirements: US-3.1, US-3.2, US-3.3, US-3.4, US-3.11, TR-5_

  - [x] 6.2 Asset grid component
    - Create `src/components/cms/asset-grid.tsx`
    - Display assets in responsive CSS grid (1 col mobile, 2 tablet, 3-4 desktop)
    - Use NextUI Card for each asset with image thumbnail
    - Implement lazy loading for images using loading="lazy" attribute
    - Show filename, file size (formatted), dimensions (if available)
    - Add NextUI Dropdown menu per asset with actions: View Details, Edit, Download, Delete
    - Support selectionMode prop for media picker (single/multiple)
    - Highlight selected assets with border/checkmark overlay
    - Handle click events for selection mode
    - Show placeholder icon for non-image files (documents, videos)
    - _Requirements: US-3.1, US-3.5, US-3.9, US-3.10, TR-3, TR-5_

  - [x] 6.3 Asset detail/edit page
    - Create `src/app/dashboard/cms/media/[id]/page.tsx`
    - Display full asset details in NextUI Card layout
    - Show large preview for images, icon for other file types
    - Display metadata: URL (with copy button), filename, MIME type, file size, dimensions, upload date, creator
    - Add editable alt text field using NextUI Input
    - Add metadata JSON editor using NextUI Textarea (with JSON validation)
    - Add "Download" button to download file
    - Add "Delete" button with NextUI Modal confirmation
    - Use useUpdateAsset mutation for updates
    - Show success/error toasts for operations
    - Add breadcrumb navigation back to media list
    - _Requirements: US-3.5, US-3.6, US-3.7, US-3.8, TR-3_

- [x] 7. Asset Upload Interface
  - [x] 7.1 Upload page
    - Create `src/app/dashboard/cms/media/upload/page.tsx`
    - Add NextUI Select for collection selection (required, fetch from useCollections)
    - Integrate asset-upload component below collection selector
    - Show upload queue with progress bars for each file
    - Display success/error messages per file using NextUI Chip components
    - Add "Upload More Files" button to reset upload component
    - Add "View Library" button linking to /dashboard/cms/media
    - Disable upload until collection is selected
    - _Requirements: US-2.1, TR-3_

  - [x] 7.2 Asset upload component
    - Create `src/components/cms/asset-upload.tsx`
    - Implement drag-and-drop zone using react-dropzone
    - Style dropzone with dashed border, hover effects using Tailwind
    - Add click-to-select file input (hidden, triggered by dropzone)
    - Support multiple file selection (multiple prop)
    - Validate file type against collection's allowed_mime_types before upload
    - Validate file size against collection's max_file_size before upload
    - Show validation errors using NextUI Alert component
    - Add NextUI Input for alt text per image file (conditional)
    - Display upload progress using NextUI Progress component per file
    - Show file preview thumbnails for images
    - Add retry button for failed uploads
    - Use useUploadAsset mutation with onUploadProgress callback
    - Clear successful uploads from queue after 3 seconds
    - _Requirements: US-2.2, US-2.3, US-2.4, US-2.5, US-2.6, US-2.7, US-2.8, US-2.9, US-2.10, TR-4_

- [x] 8. Media Picker Modal
  - [x] 8.1 Media picker component
    - Create `src/components/cms/media-picker.tsx` modal component using NextUI Modal
    - Add prop: isOpen (boolean), onClose (callback), onSelect (callback with selected assets)
    - Add prop: selectionMode ('single' | 'multiple'), defaultCollection (optional)
    - Add NextUI Tabs with two tabs: "Browse Library" and "Upload New"
    - In Browse tab: integrate asset-grid component with selection mode enabled
    - Add collection filter NextUI Select in Browse tab
    - Add search NextUI Input in Browse tab with 300ms debounce
    - Highlight selected assets with checkmark overlay and border
    - Add pagination for large asset lists (20 per page)
    - In Upload tab: integrate asset-upload component
    - Auto-select newly uploaded assets and switch to Browse tab after upload
    - Add modal footer with "Confirm" (primary) and "Cancel" (light) NextUI Buttons
    - Disable Confirm button when no assets selected
    - Call onSelect with selected assets array on confirm
    - Call onClose on cancel or backdrop click
    - _Requirements: US-4.1, US-4.2, US-4.3, US-4.4, US-4.5, US-4.6, US-4.7, US-4.8, US-4.9, US-4.10, TR-3_

  - [x] 8.2 Integrate upload in media picker
    - Pass collection prop to asset-upload component in Upload tab
    - Handle upload success events to add assets to selection
    - Automatically switch to Browse tab after successful upload
    - Show newly uploaded assets at top of grid
    - _Requirements: US-4.3, TR-4_

- [x] 9. Entity Relations Interface
  - [x] 9.1 Attached assets component
    - Create `src/components/cms/attached-assets.tsx`
    - Add props: entityType (string), entityId (number), readonly (boolean, default false)
    - Fetch attached assets using useRelations hook
    - Display assets in sortable list using @dnd-kit/sortable
    - Show asset thumbnail, filename, file size per item
    - Add "Attach Media" NextUI Button to open media-picker modal
    - Add "Remove" button per asset (with confirmation)
    - Implement drag handles for reordering (only when not readonly)
    - Call useReorderRelations mutation on drag end with new display_order
    - Call useAttachAsset mutation when assets selected from picker
    - Call useDetachAsset mutation on remove
    - Show loading spinner during operations
    - Display empty state when no assets attached
    - _Requirements: US-5.1, US-5.2, US-5.3, US-5.4, US-5.5, TR-3_

  - [x] 9.2 Integration example (Article form)
    - Add attached-assets component to article edit form
    - Pass entityType="article" and entityId from route params
    - Place component in appropriate section of form layout
    - Handle loading states while relations are fetching
    - Show success toast when assets are attached/detached
    - _Requirements: US-5.6, US-5.7_

- [x] 10. Error Handling and Loading States
  - [x] 10.1 Error boundaries and fallbacks
    - Add error boundary wrapper to media pages using React error boundaries
    - Create error fallback component with retry button and error message display
    - Display user-friendly error messages using NextUI Alert component
    - Add retry mechanisms for failed queries using React Query's refetch
    - Log errors to console for debugging (consider error tracking service integration)
    - Handle network errors, 404s, 403s, and 500s with appropriate messages
    - _Requirements: TR-7_

  - [x] 10.2 Loading states
    - Add NextUI Skeleton loaders for asset grid (show 20 skeleton cards)
    - Add NextUI Spinner for mutations and form submissions
    - Add NextUI Progress bars for file uploads with percentage
    - Implement optimistic UI updates for asset deletion and reordering
    - Show loading state in buttons during async operations
    - Add suspense boundaries for async components
    - _Requirements: TR-2, TR-4_

- [x] 11. Accessibility and Responsive Design
  - [x] 11.1 Accessibility improvements
    - Add alt text to all images (use asset.alt_text or filename as fallback)
    - Ensure keyboard navigation works for all interactive elements (Tab, Enter, Escape)
    - Add proper ARIA labels to buttons, inputs, and interactive elements
    - Add ARIA live regions for dynamic content updates (upload progress, errors)
    - Test with screen readers (VoiceOver on Mac, NVDA on Windows)
    - Ensure color contrast meets WCAG AA standards (use NextUI's built-in accessible colors)
    - Add focus visible styles for keyboard navigation
    - Ensure modals trap focus and return focus on close
    - _Requirements: TR-6_

  - [x] 11.2 Responsive layouts
    - Test on mobile (320px-767px), tablet (768px-1023px), and desktop (1024px+) viewports
    - Adjust asset grid columns: 1 col mobile, 2 cols tablet, 3-4 cols desktop
    - Make modals full-screen on mobile, centered on desktop
    - Ensure touch-friendly tap targets (minimum 44x44px)
    - Test drag-and-drop on touch devices
    - Adjust table layouts to be scrollable on mobile
    - Use NextUI's responsive props where available
    - _Requirements: TR-3, NFR-3_

- [x] 12. Performance Optimization
  - [x] 12.1 Image optimization
    - Implement lazy loading for asset thumbnails using loading="lazy" attribute
    - Use Next.js Image component for static images where applicable
    - Generate optimized thumbnail URLs from backend (if available)
    - Add blur placeholder for images while loading
    - Optimize thumbnail sizes (max 300x300px for grid view)
    - Consider using Vercel Blob's image optimization features
    - _Requirements: TR-5, NFR-1_

  - [x] 12.2 Code splitting and caching
    - Implement dynamic imports for media picker modal (lazy load)
    - Configure React Query cache times: collections (60s stale), assets (30s stale)
    - Add debouncing to search inputs using lodash.debounce (300ms delay)
    - Optimize bundle size by checking for unused dependencies
    - Use React.memo for expensive components (asset-grid items)
    - Implement virtual scrolling for very large asset lists (if needed)
    - _Requirements: TR-5, NFR-1_

- [x] 13. Testing and Documentation
  - [x] 13.1 Component testing
    - Write unit tests for utility functions (format-file-size, validate-file, generate-preview)
    - Write integration tests for React Query hooks using @testing-library/react-hooks
    - Test form validation logic with various input scenarios
    - Test file upload flow with mock files and progress tracking
    - Test media picker selection modes (single vs multiple)
    - Use Jest and React Testing Library for component tests
    - _Requirements: NFR-4_

  - [x] 13.2 Documentation
    - Document component props and usage with JSDoc comments
    - Add inline comments for complex logic (file validation, drag-and-drop)
    - Create usage examples for media picker component in comments
    - Document API service methods with parameter types and return types
    - Add README section for CMS media feature with setup instructions
    - Document environment variables needed (API URLs, Blob token)
    - _Requirements: NFR-4_

- [x] 14. Final Integration and Polish
  - [x] 14.1 Navigation integration
    - Add "Media Library" link to dashboard sidebar navigation
    - Add "Collections" link to dashboard sidebar navigation under CMS section
    - Ensure proper route protection using existing auth middleware
    - Add active state styling for media routes in sidebar
    - Test navigation flow between all media pages
    - Add breadcrumb navigation to detail pages
    - _Requirements: TR-1_

  - [x] 14.2 UI polish and consistency
    - Ensure consistent spacing using Tailwind spacing scale (p-4, gap-4, etc.)
    - Match existing dashboard typography (Nunito font, text sizes)
    - Add smooth transitions using Framer Motion for modals and dropdowns
    - Test dark theme support (default theme) for all components
    - Add toast notifications using NextUI's toast/Sonner for success/error states
    - Ensure consistent button styles (primary, secondary, danger)
    - Add hover effects and focus states to interactive elements
    - Polish empty states with illustrations and helpful messages
    - _Requirements: TR-3, NFR-3_

- [x] 15. Checkpoint - Ensure all features work end-to-end
  - Test complete workflow: create collection → upload assets → attach to entity → view in article
  - Verify all CRUD operations work correctly (create, read, update, delete)
  - Test error scenarios: invalid files, network failures, validation errors
  - Verify performance meets requirements (< 2s page load, < 500ms search results)
  - Ensure accessibility standards are met (keyboard navigation, screen reader support)
  - Test on multiple browsers (Chrome, Firefox, Safari, Edge)
  - Test on multiple devices (mobile, tablet, desktop)
  - Verify all toast notifications appear correctly
  - Check that all loading states display properly
  - Ensure proper error handling and recovery
  - Ask the user if questions arise or if any issues are found

---

## Notes

- **Backend API is already functional** - focus on frontend integration only
- Use existing **cms-api-client** from `src/common/config/` for all HTTP requests (already configured with auth and tenant headers)
- **React Query** is being added as a new dependency for this feature
- Follow existing dashboard patterns for consistency (check other dashboard pages for reference)
- All pages require **admin authentication** (handled by existing middleware)
- **Vercel Blob Storage** is already configured on backend
- Test with real file uploads to verify integration with backend
- Use **NextUI components** for all UI elements to maintain consistency
- Follow **kebab-case** naming for files and **camelCase** for functions/variables
- Use **Zod** for validation schemas (primary validation library)
- Use **Lucide React** for icons (primary icon library)

## Implementation Order

1. **Foundation** (Tasks 1-4): Dependencies, types, services, hooks, utilities, schemas
2. **Collections** (Task 5): Collection management UI (list, create, edit)
3. **Assets** (Tasks 6-7): Asset browsing and upload interface
4. **Media Picker** (Task 8): Reusable modal component for asset selection
5. **Relations** (Task 9): Entity attachment functionality with drag-and-drop
6. **Polish** (Tasks 10-15): Error handling, accessibility, performance, testing, integration

## Success Criteria

- ✅ Users can create and manage collections with validation
- ✅ Users can upload files with drag-and-drop and see progress
- ✅ Users can browse and search assets with filters
- ✅ Users can attach assets to entities (articles, blogs)
- ✅ Upload progress is visible with percentage
- ✅ All operations have proper error handling with user-friendly messages
- ✅ UI is responsive (mobile, tablet, desktop) and accessible (WCAG AA)
- ✅ Performance meets requirements (< 2s page load, < 500ms search)
- ✅ Dark theme is fully supported
- ✅ All components use NextUI for consistency

## Key Technical Decisions

- **State Management**: React Query for server state, React Hook Form for forms
- **File Upload**: react-dropzone with multipart/form-data via Axios
- **Drag & Drop**: @dnd-kit for reordering attached assets
- **Validation**: Zod schemas with React Hook Form resolver
- **UI Components**: NextUI (primary), Lucide React (icons)
- **Styling**: Tailwind CSS with dark theme support
- **API Client**: Existing cms-api-client with automatic auth/tenant headers
