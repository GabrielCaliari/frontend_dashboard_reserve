# CMS Media Storage Frontend - Requirements

## Feature Overview

Implement the frontend UI for the existing CMS media storage backend API. The backend is already functional with Vercel Blob Storage, supporting file uploads, collections, and entity relations. This spec focuses on building the React/Next.js interface to interact with these APIs.

## User Stories

### US-1: Media Collection Management
**As a** CMS administrator  
**I want to** create and manage media collections with specific rules  
**So that** I can organize assets by context and enforce validation rules

**Acceptance Criteria:**
- 1.1: User can create a new media collection with name, description, and type
- 1.2: User can define allowed MIME types for each collection
- 1.3: User can set maximum file size limit per collection
- 1.4: User can optionally set maximum number of items per collection
- 1.5: User can view a list of all collections with filtering by type
- 1.6: User can edit existing collection settings
- 1.7: User can delete collections (with confirmation)
- 1.8: System validates collection slug uniqueness

### US-2: Media Asset Upload
**As a** CMS user  
**I want to** upload media files to collections  
**So that** I can store and manage content assets

**Acceptance Criteria:**
- 2.1: User can select a collection before uploading
- 2.2: User can drag and drop files or click to select
- 2.3: System validates file type against collection's allowed MIME types
- 2.4: System validates file size against collection's max file size
- 2.5: User can add alt text for images during upload
- 2.6: User can upload multiple files simultaneously
- 2.7: System shows upload progress for each file
- 2.8: System displays success/error status for each upload
- 2.9: Failed uploads show clear error messages
- 2.10: User can retry failed uploads

### US-3: Media Asset Management
**As a** CMS user  
**I want to** view and manage uploaded assets  
**So that** I can organize and maintain my media library

**Acceptance Criteria:**
- 3.1: User can view assets in a grid layout with thumbnails
- 3.2: User can filter assets by collection
- 3.3: User can filter assets by status (active, archived, failed)
- 3.4: User can search assets by filename
- 3.5: User can view asset details (URL, size, dimensions, metadata)
- 3.6: User can edit asset alt text and metadata
- 3.7: User can download assets
- 3.8: User can delete assets (with confirmation)
- 3.9: System displays file size in human-readable format
- 3.10: System displays image dimensions when available
- 3.11: User can paginate through large asset lists

### US-4: Media Picker (Modal)
**As a** CMS user  
**I want to** select media from my library in a modal  
**So that** I can attach assets to articles and other entities

**Acceptance Criteria:**
- 4.1: User can open media picker modal from any context
- 4.2: User can browse existing assets in the modal
- 4.3: User can upload new assets directly from the modal
- 4.4: User can filter assets by collection in the modal
- 4.5: User can search assets by filename in the modal
- 4.6: User can select single or multiple assets (configurable)
- 4.7: Selected assets are visually highlighted
- 4.8: User can confirm selection and close modal
- 4.9: User can cancel selection and close modal
- 4.10: Modal supports pagination for large asset lists

### US-5: Media Relations (Entity Attachment)
**As a** CMS user  
**I want to** attach media assets to entities (articles, blogs, etc.)  
**So that** I can associate content with visual assets

**Acceptance Criteria:**
- 5.1: User can attach one or more assets to an entity
- 5.2: User can view all assets attached to an entity
- 5.3: User can reorder attached assets via drag-and-drop
- 5.4: User can detach assets from entities
- 5.5: System maintains display order for attached assets
- 5.6: System supports polymorphic relations (any entity type)
- 5.7: System stores optional metadata per relation

## Technical Requirements

### TR-1: API Integration
- Use existing CMS API client (`cms-api-client.ts`) - already configured with:
  - Base URL: `${NEXT_PUBLIC_API_URL}/cms/`
  - JWT token from cookies (automatic)
  - Session ID from cookies (automatic)
  - Tenant ID from localStorage (automatic)
- All API endpoints require admin authentication (handled by backend)
- Backend uses Vercel Blob Storage (BLOB_READ_WRITE_TOKEN configured)

### TR-2: State Management
- Use React Query (TanStack Query) for server state
- Implement proper cache invalidation strategies
- Use optimistic updates where appropriate
- Handle loading and error states consistently

### TR-3: UI Components
- Use NextUI components for consistency
- Follow existing design patterns from the dashboard
- Implement responsive layouts (mobile, tablet, desktop)
- Support dark theme (default)
- Use Lucide React icons

### TR-4: File Handling
- Use react-dropzone for drag-and-drop functionality
- Support multipart/form-data uploads
- Display upload progress
- Handle file validation client-side before upload
- Generate preview URLs for images

### TR-5: Performance
- Implement pagination for large lists (20 items per page default)
- Lazy load images in grid views
- Debounce search inputs
- Cache collection data (1 minute stale time)
- Optimize bundle size (code splitting for media pages)

### TR-6: Accessibility
- Provide alt text for all images
- Support keyboard navigation
- Use semantic HTML elements
- Ensure proper ARIA labels
- Maintain color contrast ratios

### TR-7: Error Handling
- Display user-friendly error messages
- Log errors for debugging
- Handle network failures gracefully
- Provide retry mechanisms for failed operations
- Validate inputs before API calls

## Data Models

### MediaCollection
```typescript
{
  id: number;
  name: string;
  slug: string;
  description?: string;
  type: 'images' | 'documents' | 'videos' | 'mixed';
  allowed_mime_types: string[];
  max_file_size: number; // bytes
  max_items?: number;
  tenant_id: number;
  created_at: string;
  updated_at: string;
}
```

### MediaAsset
```typescript
{
  id: number;
  url: string;
  storage_key: string;
  filename: string;
  mime_type: string;
  file_size: number; // bytes
  width?: number;
  height?: number;
  alt_text?: string;
  metadata?: Record<string, any>;
  status: 'active' | 'archived' | 'failed';
  collection_id: number;
  tenant_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}
```

### MediaRelation
```typescript
{
  id: number;
  asset_id: number;
  entity_type: string; // e.g., 'article', 'blog'
  entity_id: number;
  display_order: number;
  metadata?: Record<string, any>;
  tenant_id: number;
  created_at: string;
  asset?: MediaAsset; // populated in responses
}
```

## Backend API Status

### ✅ Already Implemented (Backend)

The following endpoints are **already functional** on the backend:

#### Collections
- `GET /api/cms/collections` - List collections (with pagination)
- `GET /api/cms/collections/:id` - Get collection details
- `POST /api/cms/collections` - Create collection
- `PATCH /api/cms/collections/:id` - Update collection
- `DELETE /api/cms/collections/:id` - Delete collection

#### Assets
- `GET /api/cms/assets` - List assets (with filters and pagination)
- `GET /api/cms/assets/:id` - Get asset details
- `POST /api/cms/assets` - Upload asset (multipart/form-data)
- `PATCH /api/cms/assets/:id` - Update asset metadata
- `DELETE /api/cms/assets/:id` - Delete asset

#### Relations
- `GET /api/cms/relations` - List relations (filtered by entity)
- `POST /api/cms/relations` - Attach asset to entity
- `DELETE /api/cms/relations/:id` - Detach asset from entity
- `PATCH /api/cms/relations/reorder` - Reorder relations

**Backend Features:**
- ✅ Vercel Blob Storage integration (active)
- ✅ Automatic WebP conversion for images
- ✅ File validation (size, type, collection limits)
- ✅ Tenant isolation via `x-tenant-id` header
- ✅ Admin authentication via JWT
- ✅ Polymorphic relations support

**What We Need to Build:**
- ❌ Frontend UI pages and components
- ❌ React Query hooks for API integration
- ❌ Type definitions for frontend
- ❌ Media picker modal component
- ❌ Upload interface with drag-and-drop

## Dependencies

### ⚠️ Dependencies to Install
```bash
pnpm add react-dropzone
```

### ✅ Already Installed
- Next.js 16.1.6
- React 19.2.4
- NextUI (UI components)
- Axios (HTTP client)
- Lucide React (icons)
- Framer Motion (animations)
- React Hook Form (forms)
- Zod (validation)

### ℹ️ Note on React Query
The project **does not currently use React Query**. We have two options:
1. **Option A (Recommended):** Install React Query for this feature
   - Better caching and state management
   - Follows the guide's architecture
   - More maintainable for complex data fetching
2. **Option B:** Use existing patterns (SWR or direct API calls)
   - Consistent with current codebase
   - No new dependencies
   - May require more manual cache management

**Decision needed:** Which approach should we take?

## File Structure

```
src/
├── app/dashboard/cms/
│   ├── media/
│   │   ├── page.tsx                    # Media list page
│   │   ├── upload/
│   │   │   └── page.tsx                # Upload page
│   │   └── [id]/
│   │       └── page.tsx                # Asset detail page
│   └── collections/
│       ├── page.tsx                    # Collections list page
│       ├── new/
│       │   └── page.tsx                # Create collection page
│       └── [id]/
│           └── page.tsx                # Edit collection page
│
├── components/cms/
│   ├── asset-grid.tsx                  # Asset grid component
│   ├── asset-upload.tsx                # Upload component
│   ├── collection-form.tsx             # Collection form
│   └── media-picker.tsx                # Media picker modal
│
├── common/
│   ├── @types/
│   │   └── @cms-media.ts               # Media types
│   ├── hooks/
│   │   ├── use-assets.ts               # Assets hooks
│   │   ├── use-collections.ts          # Collections hooks
│   │   └── use-relations.ts            # Relations hooks
│   └── utils/
│       └── format-file-size.ts         # File size formatter
│
└── app/providers.tsx                   # Add React Query provider
```

## Non-Functional Requirements

### NFR-1: Performance
- Page load time < 2 seconds
- Upload progress updates every 100ms
- Search results debounced by 300ms
- Grid rendering optimized for 100+ items

### NFR-2: Security
- Validate file types server-side
- Sanitize filenames
- Enforce tenant isolation
- Require authentication for all operations

### NFR-3: Usability
- Intuitive drag-and-drop interface
- Clear visual feedback for all actions
- Consistent with existing dashboard UI
- Mobile-responsive design

### NFR-4: Maintainability
- Follow existing code conventions
- Use TypeScript strict mode
- Document complex logic
- Write reusable components

## Out of Scope

### Backend (Already Handled)
- ✅ File storage (Vercel Blob Storage)
- ✅ Image optimization (WebP conversion)
- ✅ File validation
- ✅ Tenant isolation
- ✅ Authentication

### Frontend (Not in This Spec)
- Image editing/cropping functionality
- Video player/preview
- Bulk operations (select all, bulk delete)
- Advanced search (tags, metadata search)
- Asset versioning UI
- Folder/subfolder organization within collections
- Drag-and-drop reordering in grid view

## Success Metrics

- Users can upload assets in < 5 clicks
- Upload success rate > 95%
- Asset search returns results in < 500ms
- Zero accessibility violations (WCAG AA)
- Component reusability > 80%
