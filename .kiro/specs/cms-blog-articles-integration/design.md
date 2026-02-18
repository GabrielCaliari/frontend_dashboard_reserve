# Design Document: CMS Blog and Articles Integration

## Overview

This design specifies the implementation of a Content Management System (CMS) for blogs and articles within the ZARP Admin Dashboard. The system provides a dual-layer architecture:

1. **Public API Layer**: Lightweight endpoints for frontend consumption, authenticated via blog-specific secret keys
2. **Administrative Layer**: Full-featured CMS management with JWT authentication and role-based access control

The implementation follows the existing ZARP architecture patterns, utilizing Next.js 16 App Router, React 19, TypeScript, TanStack Query for state management, and NextUI for UI components. The design emphasizes separation of concerns through distinct layers: API clients, query functions, React Query hooks, and presentational components.

### Key Design Principles

- **Single Responsibility Principle (SRP)**: Each component has one clear purpose
- **Layered Architecture**: Clear separation between data fetching, state management, and presentation
- **Type Safety**: Comprehensive TypeScript types for all data structures and API contracts
- **Tenant Isolation**: All operations validate tenant ownership to prevent cross-tenant data access
- **Role-Based Access Control**: Four permission levels (viewer, editor, manager, owner) enforced at API layer
- **Optimistic UI Updates**: Immediate feedback with rollback on errors
- **Cache Management**: Strategic use of TanStack Query for performance and UX

## Architecture

### System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  (Pages, Containers, UI Components, Forms, Modals)          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   State Management Layer                     │
│         (React Query Hooks, Zustand Stores)                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Data Fetching Layer                        │
│              (Query Functions, Mutations)                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   HTTP Client Layer                          │
│         (API Clients with Authentication)                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                             │
│         (Public Endpoints + Admin Endpoints)                 │
└─────────────────────────────────────────────────────────────┘
```

### Directory Structure

```
src/
├── app/
│   └── dashboard/
│       └── cms/
│           ├── blogs/
│           │   ├── page.tsx                    # Blog list page
│           │   └── [blogId]/
│           │       ├── page.tsx                # Blog detail page
│           │       └── articles/
│           │           ├── page.tsx            # Article list page
│           │           ├── new/
│           │           │   └── page.tsx        # Create article page
│           │           └── [articleId]/
│           │               ├── page.tsx        # Edit article page
│           │               └── preview/
│           │                   └── page.tsx    # Preview article page
│           └── public/
│               └── [blogSlug]/
│                   ├── page.tsx                # Public blog listing
│                   └── [articleSlug]/
│                       └── page.tsx            # Public article detail
│
├── common/
│   ├── @types/
│   │   ├── @cms-blog.ts                       # Blog type definitions
│   │   ├── @cms-article.ts                    # Article type definitions
│   │   └── @cms-image.ts                      # Image type definitions
│   ├── config/
│   │   ├── cms-api-client.ts                  # Admin API client
│   │   └── cms-public-api-client.ts           # Public API client
│   ├── hooks/
│   │   ├── cms/
│   │   │   ├── useBlogs.ts                    # Blog query hooks
│   │   │   ├── useBlogMutations.ts            # Blog mutation hooks
│   │   │   ├── useArticles.ts                 # Article query hooks
│   │   │   ├── useArticleMutations.ts         # Article mutation hooks
│   │   │   ├── usePublicArticles.ts           # Public article hooks
│   │   │   └── useImageMutations.ts           # Image mutation hooks
│   ├── schemas/
│   │   ├── cms-blog-schema.ts                 # Blog validation schemas
│   │   ├── cms-article-schema.ts              # Article validation schemas
│   │   └── cms-image-schema.ts                # Image validation schemas
│   ├── services/
│   │   ├── cms-blog-service.ts                # Blog API functions
│   │   ├── cms-article-service.ts             # Article API functions
│   │   └── cms-public-service.ts              # Public API functions
│   └── utils/
│       ├── slug-generator.ts                  # Slug generation utility
│       └── content-sanitizer.ts               # HTML sanitization
│
└── components/
    └── cms/
        ├── blogs/
        │   ├── blog-list.tsx                  # Blog list component
        │   ├── blog-card.tsx                  # Blog card component
        │   ├── blog-form.tsx                  # Blog create/edit form
        │   ├── blog-secret-key-display.tsx    # Secret key display with copy
        │   └── blog-stats.tsx                 # Blog statistics
        ├── articles/
        │   ├── article-list.tsx               # Article list component
        │   ├── article-table-row.tsx          # Article table row
        │   ├── article-form.tsx               # Article create/edit form
        │   ├── article-editor.tsx             # Rich text editor
        │   ├── article-preview.tsx            # Article preview
        │   ├── article-status-badge.tsx       # Status indicator
        │   └── article-reorder.tsx            # Drag-and-drop reorder
        ├── images/
        │   ├── image-upload.tsx               # Image upload component
        │   ├── image-gallery.tsx              # Image gallery with reorder
        │   └── image-card.tsx                 # Individual image card
        └── public/
            ├── public-article-list.tsx        # Public article listing
            ├── public-article-card.tsx        # Public article card
            └── public-article-content.tsx     # Public article renderer
```



## Components and Interfaces

### HTTP Client Layer

#### CMS Admin API Client

**File**: `src/common/config/cms-api-client.ts`

**Responsibility**: Provide configured axios instance for CMS administrative endpoints with JWT authentication.

**Implementation**:
```typescript
import axios from 'axios';

const CMS_API_URL = process.env.NEXT_PUBLIC_API_URL;

const cmsApiClient = axios.create({
  baseURL: `${CMS_API_URL}/api/cms`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT and tenant headers
cmsApiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add tenant ID from localStorage
    try {
      const tenantStorage = localStorage.getItem('tenant-storage');
      if (tenantStorage) {
        const { state } = JSON.parse(tenantStorage);
        if (state?.selectedTenant?.id) {
          config.headers['x-tenant-id'] = state.selectedTenant.id.toString();
        }
      }
    } catch (error) {
      console.warn('Failed to read tenant from storage:', error);
    }
  }
  return config;
});

// Response interceptor - Handle auth errors
cmsApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        document.cookie = 'token=; Max-Age=0; path=/;';
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default cmsApiClient;
```

#### CMS Public API Client

**File**: `src/common/config/cms-public-api-client.ts`

**Responsibility**: Provide configured axios instance for public CMS endpoints with blog secret key authentication.

**Implementation**:
```typescript
import axios from 'axios';

const CMS_API_URL = process.env.NEXT_PUBLIC_API_URL;

export const createPublicCmsClient = (blogSecretKey: string) => {
  const client = axios.create({
    baseURL: `${CMS_API_URL}/api/cms/public`,
    headers: {
      'Content-Type': 'application/json',
      'X-Blog-Secret': blogSecretKey,
    },
  });

  return client;
};
```

### Service Layer (Query Functions)

#### Blog Service

**File**: `src/common/services/cms-blog-service.ts`

**Responsibility**: Encapsulate all blog-related API calls.

**Functions**:
- `fetchBlogs()`: GET /blogs - List all blogs for tenant
- `fetchBlogById(blogId)`: GET /blogs/:blogId - Get single blog
- `createBlog(data)`: POST /blogs - Create new blog
- `updateBlog(blogId, data)`: PUT /blogs/:blogId - Update blog
- `deleteBlog(blogId)`: DELETE /blogs/:blogId - Delete blog
- `regenerateBlogSecretKey(blogId)`: POST /blogs/:blogId/regenerate-key - Regenerate secret

**Type Signatures**:
```typescript
export interface CreateBlogDto {
  name: string;
  description?: string;
}

export interface UpdateBlogDto {
  name?: string;
  description?: string;
}

export const fetchBlogs = async (): Promise<Blog[]> => {
  const response = await cmsApiClient.get('/blogs');
  return response.data;
};

export const createBlog = async (data: CreateBlogDto): Promise<Blog> => {
  const response = await cmsApiClient.post('/blogs', data);
  return response.data;
};

// ... other functions
```

#### Article Service

**File**: `src/common/services/cms-article-service.ts`

**Responsibility**: Encapsulate all article-related API calls.

**Functions**:
- `fetchArticles(blogId, status?)`: GET /blogs/:blogId/articles - List articles
- `fetchArticleById(blogId, articleId)`: GET /blogs/:blogId/articles/:articleId - Get article
- `createArticle(blogId, data)`: POST /blogs/:blogId/articles - Create article
- `updateArticle(blogId, articleId, data)`: PUT /blogs/:blogId/articles/:articleId - Update article
- `deleteArticle(blogId, articleId)`: DELETE /blogs/:blogId/articles/:articleId - Delete article
- `publishArticle(blogId, articleId)`: POST /blogs/:blogId/articles/:articleId/publish - Publish
- `archiveArticle(blogId, articleId)`: POST /blogs/:blogId/articles/:articleId/archive - Archive
- `reorderArticles(blogId, order)`: PUT /blogs/:blogId/articles/reorder - Reorder articles

**Type Signatures**:
```typescript
export interface CreateArticleDto {
  title: string;
  content: string;
}

export interface UpdateArticleDto {
  title?: string;
  content?: string;
}

export interface ReorderArticleDto {
  id: number;
  display_order: number;
}

export const fetchArticles = async (
  blogId: number,
  status?: ArticleStatus
): Promise<Article[]> => {
  const params = status ? { status } : {};
  const response = await cmsApiClient.get(`/blogs/${blogId}/articles`, { params });
  return response.data;
};

// ... other functions
```

#### Public CMS Service

**File**: `src/common/services/cms-public-service.ts`

**Responsibility**: Encapsulate public API calls for frontend consumption.

**Functions**:
- `fetchPublicArticles(secretKey, page, limit)`: GET /public/articles - List published articles
- `fetchPublicArticleBySlug(secretKey, slug)`: GET /public/articles/:slug - Get article by slug

**Type Signatures**:
```typescript
export interface PublicArticlesParams {
  page?: number;
  limit?: number;
}

export interface PublicArticlesResponse {
  data: Article[];
  meta: {
    current_page: number;
    total_pages: number;
    total_records: number;
  };
}

export const fetchPublicArticles = async (
  secretKey: string,
  params: PublicArticlesParams = {}
): Promise<PublicArticlesResponse> => {
  const client = createPublicCmsClient(secretKey);
  const response = await client.get('/articles', { params });
  return response.data;
};

// ... other functions
```

### React Query Hooks Layer

#### Blog Query Hooks

**File**: `src/common/hooks/cms/useBlogs.ts`

**Responsibility**: Manage blog data fetching and caching.

**Hooks**:
- `useBlogs()`: Query hook for fetching all blogs
- `useBlog(blogId)`: Query hook for fetching single blog

**Implementation**:
```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchBlogs, fetchBlogById } from '@/common/services/cms-blog-service';

export const BLOG_QUERY_KEYS = {
  all: ['cms', 'blogs'] as const,
  detail: (id: number) => ['cms', 'blogs', id] as const,
};

export const useBlogs = () => {
  return useQuery({
    queryKey: BLOG_QUERY_KEYS.all,
    queryFn: fetchBlogs,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useBlog = (blogId: number) => {
  return useQuery({
    queryKey: BLOG_QUERY_KEYS.detail(blogId),
    queryFn: () => fetchBlogById(blogId),
    enabled: !!blogId,
    staleTime: 5 * 60 * 1000,
  });
};
```

#### Blog Mutation Hooks

**File**: `src/common/hooks/cms/useBlogMutations.ts`

**Responsibility**: Manage blog mutations (create, update, delete, regenerate key).

**Hooks**:
- `useCreateBlog()`: Mutation hook for creating blogs
- `useUpdateBlog()`: Mutation hook for updating blogs
- `useDeleteBlog()`: Mutation hook for deleting blogs
- `useRegenerateBlogKey()`: Mutation hook for regenerating secret keys

**Implementation**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createBlog, updateBlog, deleteBlog, regenerateBlogSecretKey } from '@/common/services/cms-blog-service';
import { BLOG_QUERY_KEYS } from './useBlogs';

export const useCreateBlog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createBlog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEYS.all });
    },
  });
};

export const useUpdateBlog = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ blogId, data }: { blogId: number; data: UpdateBlogDto }) =>
      updateBlog(blogId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: BLOG_QUERY_KEYS.detail(variables.blogId) });
    },
  });
};

// ... other mutation hooks
```

#### Article Query Hooks

**File**: `src/common/hooks/cms/useArticles.ts`

**Responsibility**: Manage article data fetching and caching.

**Hooks**:
- `useArticles(blogId, status?)`: Query hook for fetching articles with optional status filter
- `useArticle(blogId, articleId)`: Query hook for fetching single article

**Implementation**:
```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchArticles, fetchArticleById } from '@/common/services/cms-article-service';

export const ARTICLE_QUERY_KEYS = {
  all: (blogId: number) => ['cms', 'blogs', blogId, 'articles'] as const,
  filtered: (blogId: number, status?: ArticleStatus) => 
    ['cms', 'blogs', blogId, 'articles', { status }] as const,
  detail: (blogId: number, articleId: number) => 
    ['cms', 'blogs', blogId, 'articles', articleId] as const,
};

export const useArticles = (blogId: number, status?: ArticleStatus) => {
  return useQuery({
    queryKey: ARTICLE_QUERY_KEYS.filtered(blogId, status),
    queryFn: () => fetchArticles(blogId, status),
    enabled: !!blogId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useArticle = (blogId: number, articleId: number) => {
  return useQuery({
    queryKey: ARTICLE_QUERY_KEYS.detail(blogId, articleId),
    queryFn: () => fetchArticleById(blogId, articleId),
    enabled: !!blogId && !!articleId,
    staleTime: 2 * 60 * 1000,
  });
};
```

#### Article Mutation Hooks

**File**: `src/common/hooks/cms/useArticleMutations.ts`

**Responsibility**: Manage article mutations (create, update, delete, publish, archive, reorder).

**Hooks**:
- `useCreateArticle()`: Mutation hook for creating articles
- `useUpdateArticle()`: Mutation hook for updating articles
- `useDeleteArticle()`: Mutation hook for deleting articles
- `usePublishArticle()`: Mutation hook for publishing articles
- `useArchiveArticle()`: Mutation hook for archiving articles
- `useReorderArticles()`: Mutation hook for reordering articles

**Implementation follows same pattern as blog mutations with appropriate cache invalidation.**

#### Public Article Hooks

**File**: `src/common/hooks/cms/usePublicArticles.ts`

**Responsibility**: Manage public article data fetching for frontend pages.

**Hooks**:
- `usePublicArticles(secretKey, page, limit)`: Query hook for paginated public articles
- `usePublicArticleBySlug(secretKey, slug)`: Query hook for single article by slug

**Implementation**:
```typescript
import { useQuery } from '@tanstack/react-query';
import { fetchPublicArticles, fetchPublicArticleBySlug } from '@/common/services/cms-public-service';

export const PUBLIC_ARTICLE_QUERY_KEYS = {
  all: (secretKey: string, page: number, limit: number) => 
    ['cms', 'public', 'articles', secretKey, { page, limit }] as const,
  detail: (secretKey: string, slug: string) => 
    ['cms', 'public', 'articles', secretKey, slug] as const,
};

export const usePublicArticles = (
  secretKey: string,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: PUBLIC_ARTICLE_QUERY_KEYS.all(secretKey, page, limit),
    queryFn: () => fetchPublicArticles(secretKey, { page, limit }),
    enabled: !!secretKey,
    staleTime: 10 * 60 * 1000, // 10 minutes - public content changes less frequently
  });
};

export const usePublicArticleBySlug = (secretKey: string, slug: string) => {
  return useQuery({
    queryKey: PUBLIC_ARTICLE_QUERY_KEYS.detail(secretKey, slug),
    queryFn: () => fetchPublicArticleBySlug(secretKey, slug),
    enabled: !!secretKey && !!slug,
    staleTime: 10 * 60 * 1000,
  });
};
```

### Presentation Layer Components

#### Blog Management Components

**BlogList Component**

**File**: `src/components/cms/blogs/blog-list.tsx`

**Responsibility**: Display list of blogs with actions.

**Props**:
```typescript
interface BlogListProps {
  blogs: Blog[];
  isLoading: boolean;
  onCreateClick: () => void;
  onEditClick: (blog: Blog) => void;
  onDeleteClick: (blog: Blog) => void;
  onRegenerateKeyClick: (blog: Blog) => void;
}
```

**Features**:
- Grid layout of blog cards
- Create new blog button
- Loading skeleton states
- Empty state when no blogs exist

**BlogCard Component**

**File**: `src/components/cms/blogs/blog-card.tsx`

**Responsibility**: Display individual blog with metadata and actions.

**Props**:
```typescript
interface BlogCardProps {
  blog: Blog;
  onEdit: () => void;
  onDelete: () => void;
  onRegenerateKey: () => void;
  onViewArticles: () => void;
}
```

**Features**:
- Blog name and description
- Article count statistics
- Action menu (edit, delete, regenerate key, view articles)
- Secret key display with copy-to-clipboard

**BlogForm Component**

**File**: `src/components/cms/blogs/blog-form.tsx`

**Responsibility**: Form for creating/editing blogs.

**Props**:
```typescript
interface BlogFormProps {
  blog?: Blog; // undefined for create, defined for edit
  onSubmit: (data: CreateBlogDto | UpdateBlogDto) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}
```

**Features**:
- Name input (max 150 chars)
- Description textarea
- Form validation with Zod
- Submit and cancel buttons
- Loading state during submission

#### Article Management Components

**ArticleList Component**

**File**: `src/components/cms/articles/article-list.tsx`

**Responsibility**: Display filterable list of articles with status tabs.

**Props**:
```typescript
interface ArticleListProps {
  blogId: number;
  articles: Article[];
  isLoading: boolean;
  currentStatus?: ArticleStatus;
  onStatusChange: (status?: ArticleStatus) => void;
  onCreateClick: () => void;
  onEditClick: (article: Article) => void;
  onDeleteClick: (article: Article) => void;
  onPublishClick: (article: Article) => void;
  onArchiveClick: (article: Article) => void;
  onReorder: (reorderedArticles: ReorderArticleDto[]) => void;
}
```

**Features**:
- Status filter tabs (All, Draft, Published, Archived)
- Create new article button
- Drag-and-drop reordering
- Table view with article rows
- Bulk actions toolbar

**ArticleTableRow Component**

**File**: `src/components/cms/articles/article-table-row.tsx`

**Responsibility**: Display single article in table with actions.

**Props**:
```typescript
interface ArticleTableRowProps {
  article: Article;
  onEdit: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onArchive: () => void;
  isDragging?: boolean;
}
```

**Features**:
- Article title and slug
- Status badge
- Publication date
- Action buttons (contextual based on status)
- Drag handle for reordering

**ArticleEditor Component**

**File**: `src/components/cms/articles/article-editor.tsx`

**Responsibility**: Rich text editor for article content.

**Props**:
```typescript
interface ArticleEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  placeholder?: string;
}
```

**Features**:
- Rich text editing with @udecode/plate
- Formatting toolbar (bold, italic, headings, lists, links)
- HTML or Markdown support
- Auto-save functionality
- Character count

**ArticleForm Component**

**File**: `src/components/cms/articles/article-form.tsx`

**Responsibility**: Complete form for creating/editing articles.

**Props**:
```typescript
interface ArticleFormProps {
  blogId: number;
  article?: Article;
  onSubmit: (data: CreateArticleDto | UpdateArticleDto) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}
```

**Features**:
- Title input with slug preview
- Article editor integration
- Image gallery management
- Preview pane
- Save draft / Publish buttons
- Auto-save with debounce

#### Image Management Components

**ImageUpload Component**

**File**: `src/components/cms/images/image-upload.tsx`

**Responsibility**: Handle image uploads with drag-and-drop.

**Props**:
```typescript
interface ImageUploadProps {
  articleId: number;
  onUploadComplete: (images: ArticleImage[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}
```

**Features**:
- Drag-and-drop zone
- File input fallback
- Multiple file upload
- Image preview before upload
- Progress indicators
- File type and size validation

**ImageGallery Component**

**File**: `src/components/cms/images/image-gallery.tsx`

**Responsibility**: Display and manage article images with reordering.

**Props**:
```typescript
interface ImageGalleryProps {
  images: ArticleImage[];
  onReorder: (reorderedImages: ArticleImage[]) => void;
  onDelete: (imageId: number) => void;
  onUpdateAltText: (imageId: number, altText: string) => void;
}
```

**Features**:
- Grid layout of images
- Drag-and-drop reordering with @dnd-kit
- Delete image button
- Alt text editing
- Primary image indicator

#### Public Frontend Components

**PublicArticleList Component**

**File**: `src/components/cms/public/public-article-list.tsx`

**Responsibility**: Display published articles for public consumption.

**Props**:
```typescript
interface PublicArticleListProps {
  articles: Article[];
  isLoading: boolean;
  pagination: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}
```

**Features**:
- Grid or list layout
- Article cards with preview
- Pagination controls
- Loading skeletons
- Empty state

**PublicArticleContent Component**

**File**: `src/components/cms/public/public-article-content.tsx`

**Responsibility**: Render article content with sanitization.

**Props**:
```typescript
interface PublicArticleContentProps {
  article: Article;
}
```

**Features**:
- Title and metadata display
- Sanitized HTML rendering with DOMPurify
- Image gallery with Next.js Image optimization
- Publication date
- Responsive typography
- Social sharing buttons (optional)



## Data Models

### Type Definitions

**File**: `src/common/@types/@cms-blog.ts`

```typescript
export interface Blog {
  id: number;
  tenant_id: number;
  name: string;
  slug: string;
  description: string | null;
  secret_key: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBlogDto {
  name: string;
  description?: string;
}

export interface UpdateBlogDto {
  name?: string;
  description?: string;
}

export interface BlogWithStats extends Blog {
  article_counts: {
    draft: number;
    published: number;
    archived: number;
    total: number;
  };
}
```

**File**: `src/common/@types/@cms-article.ts`

```typescript
export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface Article {
  id: number;
  blog_id: number;
  title: string;
  slug: string;
  content: string;
  status: ArticleStatus;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  images: ArticleImage[];
}

export interface CreateArticleDto {
  title: string;
  content: string;
}

export interface UpdateArticleDto {
  title?: string;
  content?: string;
}

export interface ReorderArticleDto {
  id: number;
  display_order: number;
}

export interface ArticleListItem extends Omit<Article, 'content' | 'images'> {
  image_count: number;
}
```

**File**: `src/common/@types/@cms-image.ts`

```typescript
export interface ArticleImage {
  id: number;
  article_id: number;
  url: string;
  alt_text: string | null;
  display_order: number;
  created_at: string;
}

export interface CreateArticleImageDto {
  article_id: number;
  file: File;
  alt_text?: string;
}

export interface UpdateArticleImageDto {
  alt_text?: string;
  display_order?: number;
}

export interface ReorderImageDto {
  id: number;
  display_order: number;
}
```

### Validation Schemas

**File**: `src/common/schemas/cms-blog-schema.ts`

```typescript
import { z } from 'zod';

export const createBlogSchema = z.object({
  name: z.string()
    .min(1, 'Blog name is required')
    .max(150, 'Blog name must be 150 characters or less')
    .trim(),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .nullable(),
});

export const updateBlogSchema = z.object({
  name: z.string()
    .min(1, 'Blog name is required')
    .max(150, 'Blog name must be 150 characters or less')
    .trim()
    .optional(),
  description: z.string()
    .max(500, 'Description must be 500 characters or less')
    .optional()
    .nullable(),
}).refine(data => data.name || data.description, {
  message: 'At least one field must be provided',
});

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
```

**File**: `src/common/schemas/cms-article-schema.ts`

```typescript
import { z } from 'zod';

export const createArticleSchema = z.object({
  title: z.string()
    .min(1, 'Article title is required')
    .max(255, 'Article title must be 255 characters or less')
    .trim(),
  content: z.string()
    .min(1, 'Article content is required'),
});

export const updateArticleSchema = z.object({
  title: z.string()
    .min(1, 'Article title is required')
    .max(255, 'Article title must be 255 characters or less')
    .trim()
    .optional(),
  content: z.string()
    .min(1, 'Article content is required')
    .optional(),
}).refine(data => data.title || data.content, {
  message: 'At least one field must be provided',
});

export const reorderArticlesSchema = z.array(
  z.object({
    id: z.number().positive(),
    display_order: z.number().int().nonnegative(),
  })
).min(1, 'At least one article must be provided');

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ReorderArticlesInput = z.infer<typeof reorderArticlesSchema>;
```

**File**: `src/common/schemas/cms-image-schema.ts`

```typescript
import { z } from 'zod';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, 'Max file size is 5MB')
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    'Only .jpg, .jpeg, .png and .webp formats are supported'
  );

export const updateImageSchema = z.object({
  alt_text: z.string()
    .max(255, 'Alt text must be 255 characters or less')
    .optional()
    .nullable(),
  display_order: z.number()
    .int()
    .nonnegative()
    .optional(),
});

export const reorderImagesSchema = z.array(
  z.object({
    id: z.number().positive(),
    display_order: z.number().int().nonnegative(),
  })
).min(1, 'At least one image must be provided');

export type UpdateImageInput = z.infer<typeof updateImageSchema>;
export type ReorderImagesInput = z.infer<typeof reorderImagesSchema>;
```

### Utility Functions

**File**: `src/common/utils/slug-generator.ts`

**Responsibility**: Generate URL-friendly slugs from titles.

```typescript
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

export const ensureUniqueSlug = (baseSlug: string, existingSlugs: string[]): string => {
  let slug = baseSlug;
  let counter = 1;
  
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  
  return slug;
};
```

**File**: `src/common/utils/content-sanitizer.ts`

**Responsibility**: Sanitize HTML content to prevent XSS attacks.

```typescript
import DOMPurify from 'isomorphic-dompurify';

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
  });
};

export const stripHtml = (html: string): string => {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
};

export const truncateHtml = (html: string, maxLength: number): string => {
  const text = stripHtml(html);
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
```

### Page Components

**File**: `src/app/dashboard/cms/blogs/page.tsx`

**Responsibility**: Blog management dashboard page.

```typescript
'use client';

import { useState } from 'react';
import { useBlogs } from '@/common/hooks/cms/useBlogs';
import { useCreateBlog, useDeleteBlog, useRegenerateBlogKey } from '@/common/hooks/cms/useBlogMutations';
import BlogList from '@/components/cms/blogs/blog-list';
import BlogFormModal from '@/components/cms/blogs/blog-form-modal';
import ConfirmDialog from '@/components/ui/confirm-dialog';

export default function BlogsPage() {
  const { data: blogs, isLoading } = useBlogs();
  const createBlog = useCreateBlog();
  const deleteBlog = useDeleteBlog();
  const regenerateKey = useRegenerateBlogKey();
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null);
  
  // Handler implementations...
  
  return (
    <div className="container mx-auto p-6">
      <BlogList
        blogs={blogs || []}
        isLoading={isLoading}
        onCreateClick={() => setIsCreateModalOpen(true)}
        onEditClick={handleEdit}
        onDeleteClick={setBlogToDelete}
        onRegenerateKeyClick={handleRegenerateKey}
      />
      
      {/* Modals and dialogs */}
    </div>
  );
}
```

**File**: `src/app/dashboard/cms/blogs/[blogId]/articles/page.tsx`

**Responsibility**: Article management page for a specific blog.

```typescript
'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useArticles } from '@/common/hooks/cms/useArticles';
import { useDeleteArticle, usePublishArticle, useArchiveArticle, useReorderArticles } from '@/common/hooks/cms/useArticleMutations';
import ArticleList from '@/components/cms/articles/article-list';

export default function ArticlesPage() {
  const params = useParams();
  const blogId = Number(params.blogId);
  const [statusFilter, setStatusFilter] = useState<ArticleStatus | undefined>();
  
  const { data: articles, isLoading } = useArticles(blogId, statusFilter);
  const deleteArticle = useDeleteArticle();
  const publishArticle = usePublishArticle();
  const archiveArticle = useArchiveArticle();
  const reorderArticles = useReorderArticles();
  
  // Handler implementations...
  
  return (
    <div className="container mx-auto p-6">
      <ArticleList
        blogId={blogId}
        articles={articles || []}
        isLoading={isLoading}
        currentStatus={statusFilter}
        onStatusChange={setStatusFilter}
        onCreateClick={handleCreate}
        onEditClick={handleEdit}
        onDeleteClick={handleDelete}
        onPublishClick={handlePublish}
        onArchiveClick={handleArchive}
        onReorder={handleReorder}
      />
    </div>
  );
}
```

**File**: `src/app/dashboard/cms/blogs/[blogId]/articles/[articleId]/page.tsx`

**Responsibility**: Article editor page.

```typescript
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useArticle } from '@/common/hooks/cms/useArticles';
import { useUpdateArticle } from '@/common/hooks/cms/useArticleMutations';
import ArticleForm from '@/components/cms/articles/article-form';

export default function EditArticlePage() {
  const params = useParams();
  const router = useRouter();
  const blogId = Number(params.blogId);
  const articleId = Number(params.articleId);
  
  const { data: article, isLoading } = useArticle(blogId, articleId);
  const updateArticle = useUpdateArticle();
  
  const handleSubmit = async (data: UpdateArticleDto) => {
    await updateArticle.mutateAsync({ blogId, articleId, data });
    router.push(`/dashboard/cms/blogs/${blogId}/articles`);
  };
  
  if (isLoading) return <div>Loading...</div>;
  if (!article) return <div>Article not found</div>;
  
  return (
    <div className="container mx-auto p-6">
      <ArticleForm
        blogId={blogId}
        article={article}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
        isSubmitting={updateArticle.isPending}
      />
    </div>
  );
}
```

**File**: `src/app/cms/public/[blogSlug]/page.tsx`

**Responsibility**: Public blog listing page.

```typescript
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { usePublicArticles } from '@/common/hooks/cms/usePublicArticles';
import PublicArticleList from '@/components/cms/public/public-article-list';

// Secret key should be configured via environment variable
const BLOG_SECRET_KEY = process.env.NEXT_PUBLIC_BLOG_SECRET_KEY!;

export default function PublicBlogPage() {
  const params = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;
  
  const { data, isLoading } = usePublicArticles(BLOG_SECRET_KEY, currentPage, limit);
  
  return (
    <div className="container mx-auto p-6">
      <PublicArticleList
        articles={data?.data || []}
        isLoading={isLoading}
        pagination={{
          currentPage: data?.meta.current_page || 1,
          totalPages: data?.meta.total_pages || 1,
          onPageChange: setCurrentPage,
        }}
      />
    </div>
  );
}
```

**File**: `src/app/cms/public/[blogSlug]/[articleSlug]/page.tsx`

**Responsibility**: Public article detail page.

```typescript
'use client';

import { useParams } from 'next/navigation';
import { usePublicArticleBySlug } from '@/common/hooks/cms/usePublicArticles';
import PublicArticleContent from '@/components/cms/public/public-article-content';

const BLOG_SECRET_KEY = process.env.NEXT_PUBLIC_BLOG_SECRET_KEY!;

export default function PublicArticlePage() {
  const params = useParams();
  const slug = params.articleSlug as string;
  
  const { data: article, isLoading, error } = usePublicArticleBySlug(BLOG_SECRET_KEY, slug);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Article not found</div>;
  if (!article) return <div>Article not found</div>;
  
  return (
    <div className="container mx-auto p-6">
      <PublicArticleContent article={article} />
    </div>
  );
}
```

