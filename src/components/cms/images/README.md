# Image Management Components

Complete implementation of image management components for the CMS Blog and Articles Integration feature.

## Components

### ImageUpload

Handles image uploads with drag-and-drop support, validation, and progress tracking.

**Features:**
- Drag-and-drop zone with visual feedback
- File input fallback for accessibility
- Multiple file selection
- Image preview before upload
- Upload progress indicators
- File type validation (JPEG, PNG, WebP)
- File size validation (max 5MB)
- Alt text input for each image
- Integration with `useUploadImages` hook

**Usage:**
```tsx
import { ImageUpload } from '@/components/cms/images';

function ArticleEditor() {
  return (
    <ImageUpload
      blogId={123}
      articleId={456}
      onUploadComplete={() => {
        console.log('Upload complete!');
      }}
      maxFiles={10}
      maxSizeMB={5}
    />
  );
}
```

**Props:**
- `blogId: number` - The blog ID (required)
- `articleId: number` - The article ID (required)
- `onUploadComplete?: () => void` - Callback after successful upload
- `maxFiles?: number` - Maximum number of files (default: 10)
- `maxSizeMB?: number` - Maximum file size in MB (default: 5)

---

### ImageGallery

Displays and manages article images with drag-and-drop reordering capability using @dnd-kit.

**Features:**
- Responsive grid layout
- Drag-and-drop reordering with visual feedback
- Image thumbnails with Next.js Image optimization
- Alt text editing with inline save
- Delete image with confirmation
- Display order indicators
- Integration with `useUpdateImage`, `useDeleteImage`, and `useReorderImages` hooks

**Usage:**
```tsx
import { ImageGallery } from '@/components/cms/images';

function ArticleEditor({ article }) {
  return (
    <ImageGallery
      blogId={article.blog_id}
      articleId={article.id}
      images={article.images}
    />
  );
}
```

**Props:**
- `blogId: number` - The blog ID (required)
- `articleId: number` - The article ID (required)
- `images: ArticleImage[]` - Array of article images (required)

**Drag-and-Drop:**
- Uses @dnd-kit for smooth drag-and-drop experience
- Supports keyboard navigation
- Optimistic updates for immediate feedback
- Automatic rollback on error

---

### ImageCard

Individual image card with editing capabilities. Can be used standalone or as part of ImageGallery.

**Features:**
- Image thumbnail with Next.js Image optimization
- Alt text display and inline editing
- Display order indicator
- Delete button with confirmation
- Drag handle for reordering (optional)
- Hover effects and transitions
- Responsive design

**Usage:**
```tsx
import { ImageCard } from '@/components/cms/images';

function CustomImageList({ images }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {images.map((image, index) => (
        <ImageCard
          key={image.id}
          image={image}
          index={index}
          onDelete={(id) => console.log('Delete', id)}
          onUpdateAltText={(id, text) => console.log('Update', id, text)}
          showDragHandle={false}
        />
      ))}
    </div>
  );
}
```

**Props:**
- `image: ArticleImage` - The image data (required)
- `index: number` - Display index (required)
- `onDelete?: (imageId: number) => void` - Delete callback
- `onUpdateAltText?: (imageId: number, altText: string) => void` - Alt text update callback
- `showDragHandle?: boolean` - Show drag handle (default: false)
- `dragHandleProps?: any` - Props for drag handle (from @dnd-kit)
- `isDragging?: boolean` - Whether the card is being dragged
- `className?: string` - Additional CSS classes

---

## Integration Example

Complete example of using all three components together in an article editor:

```tsx
'use client';

import { useState } from 'react';
import { ImageUpload, ImageGallery } from '@/components/cms/images';
import { useArticle } from '@/common/hooks/cms/useArticles';

export default function ArticleImageManager({ blogId, articleId }) {
  const { data: article, isLoading } = useArticle(blogId, articleId);
  const [showUpload, setShowUpload] = useState(false);

  if (isLoading) return <div>Loading...</div>;
  if (!article) return <div>Article not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Article Images</h2>
        <Button onPress={() => setShowUpload(!showUpload)}>
          {showUpload ? 'Hide Upload' : 'Upload Images'}
        </Button>
      </div>

      {showUpload && (
        <ImageUpload
          blogId={blogId}
          articleId={articleId}
          onUploadComplete={() => {
            setShowUpload(false);
            // Images will be automatically refreshed via React Query
          }}
        />
      )}

      <ImageGallery
        blogId={blogId}
        articleId={articleId}
        images={article.images}
      />
    </div>
  );
}
```

---

## Validation

These components validate the following requirements:

- **Requirement 12.1**: Image upload to S3 storage
- **Requirement 12.2**: Image association with articles and URL generation
- **Requirement 12.3**: Alt text for accessibility
- **Requirement 12.4**: Image reordering through display_order updates
- **Requirement 12.5**: Image deletion with S3 cleanup
- **Requirement 18.3**: Image upload functionality with drag-and-drop
- **Requirement 18.4**: Uploaded images with reordering capability
- **Requirement 18.5**: Alt text editing for each image
- **Requirement 20.7**: File type and size validation

---

## Technical Details

### File Validation
- **Accepted types**: JPEG, JPG, PNG, WebP
- **Max file size**: 5MB (configurable)
- **Max files**: 10 (configurable)

### Drag-and-Drop
- Uses `@dnd-kit/core` and `@dnd-kit/sortable`
- Supports pointer and keyboard sensors
- 8px activation distance to prevent accidental drags
- Visual feedback with drag overlay
- Optimistic updates with automatic rollback on error

### State Management
- Uses TanStack Query (React Query) for server state
- Optimistic updates for immediate UI feedback
- Automatic cache invalidation on mutations
- Error handling with rollback

### Accessibility
- Alt text support for all images
- Keyboard navigation for drag-and-drop
- ARIA labels and roles
- Focus management
- Confirmation dialogs for destructive actions

---

## Dependencies

- `@nextui-org/react` - UI components
- `@dnd-kit/core` - Drag-and-drop core
- `@dnd-kit/sortable` - Sortable functionality
- `@dnd-kit/utilities` - Utility functions
- `next/image` - Image optimization
- `lucide-react` - Icons
- `@tanstack/react-query` - State management

---

## Notes

- All components use the dark theme by default
- Images are optimized using Next.js Image component
- Preview URLs are properly cleaned up to prevent memory leaks
- All mutations include proper error handling
- Components follow Reserve project conventions
