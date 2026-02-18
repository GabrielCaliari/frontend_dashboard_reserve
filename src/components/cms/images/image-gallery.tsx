"use client";

/**
 * ImageGallery Component
 *
 * Displays and manages article images with drag-and-drop reordering capability.
 *
 * Features:
 * - Responsive grid layout
 * - Drag-and-drop reordering with @dnd-kit
 * - Image thumbnails with Next.js Image optimization
 * - Alt text editing with inline save
 * - Delete image with confirmation
 * - Display order indicators
 * - Visual feedback during dragging
 * - Integration with useUpdateImage, useDeleteImage, and useReorderImages hooks
 *
 * **Validates: Requirements 12.4, 18.4**
 */

import { useState } from "react";
import Image from "next/image";
import { Button, Input, Card, CardBody } from "@nextui-org/react";
import { Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ArticleImage } from "@/src/common/@types/@cms-image";
import {
  useUpdateImage,
  useDeleteImage,
  useReorderImages,
} from "@/src/common/hooks/cms/useImageMutations";

interface ImageGalleryProps {
  blogId: number;
  articleId: number;
  images: ArticleImage[];
}

interface SortableImageCardProps {
  image: ArticleImage;
  index: number;
  blogId: number;
  articleId: number;
  onDelete: (imageId: number) => void;
  onUpdateAltText: (imageId: number, altText: string) => void;
  isDragging?: boolean;
}

function SortableImageCard({
  image,
  index,
  blogId,
  articleId,
  onDelete,
  onUpdateAltText,
  isDragging = false,
}: SortableImageCardProps) {
  const [editingAltText, setEditingAltText] = useState(false);
  const [altTextValue, setAltTextValue] = useState(image.alt_text || "");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const handleAltTextSave = () => {
    if (altTextValue !== image.alt_text) {
      onUpdateAltText(image.id, altTextValue);
    }
    setEditingAltText(false);
  };

  const handleAltTextCancel = () => {
    setAltTextValue(image.alt_text || "");
    setEditingAltText(false);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-muted/50 hover:bg-muted transition-colors">
        <CardBody className="p-0">
          {/* Image */}
          <div className="relative aspect-video bg-background">
            <Image
              src={image.url}
              alt={image.alt_text || `Image ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />

            {/* Drag handle */}
            <div
              {...attributes}
              {...listeners}
              className="absolute top-2 left-2 bg-black/70 hover:bg-black/90 rounded p-1.5 cursor-grab active:cursor-grabbing transition-colors"
            >
              <GripVertical size={18} className="text-white" />
            </div>

            {/* Delete button */}
            <Button
              size="sm"
              isIconOnly
              color="danger"
              variant="flat"
              className="absolute top-2 right-2"
              onPress={() => {
                if (confirm("Are you sure you want to delete this image?")) {
                  onDelete(image.id);
                }
              }}
            >
              <Trash2 size={16} />
            </Button>

            {/* Display order badge */}
            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium">
              #{index + 1}
            </div>
          </div>

          {/* Alt text */}
          <div className="p-3">
            {editingAltText ? (
              <div className="space-y-2">
                <Input
                  size="sm"
                  placeholder="Alt text for accessibility"
                  value={altTextValue}
                  onChange={(e) => setAltTextValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAltTextSave();
                    } else if (e.key === "Escape") {
                      handleAltTextCancel();
                    }
                  }}
                  autoFocus
                  classNames={{
                    input: "text-sm",
                    inputWrapper: "bg-background/50",
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="primary"
                    onPress={handleAltTextSave}
                    className="flex-1"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    onPress={handleAltTextCancel}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setEditingAltText(true)}
                className="text-sm text-muted-foreground hover:text-foreground/80 text-left w-full transition-colors"
              >
                {image.alt_text || "Click to add alt text"}
              </button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default function ImageGallery({
  blogId,
  articleId,
  images,
}: ImageGalleryProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [localImages, setLocalImages] = useState<ArticleImage[]>(images);

  const updateImageMutation = useUpdateImage();
  const deleteImageMutation = useDeleteImage();
  const reorderImagesMutation = useReorderImages();

  // Update local state when images prop changes
  useState(() => {
    setLocalImages(images);
  });

  // Sort images by display_order
  const sortedImages = [...localImages].sort(
    (a, b) => a.display_order - b.display_order,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedImages.findIndex((img) => img.id === active.id);
      const newIndex = sortedImages.findIndex((img) => img.id === over.id);

      const reorderedImages = arrayMove(sortedImages, oldIndex, newIndex);

      // Update display_order values
      const updatedImages = reorderedImages.map((img, index) => ({
        ...img,
        display_order: index,
      }));

      // Optimistically update local state
      setLocalImages(updatedImages);

      // Send reorder request to backend
      const reorderData = updatedImages.map((img) => ({
        id: img.id,
        display_order: img.display_order,
      }));

      reorderImagesMutation.mutate({
        blogId,
        articleId,
        order: reorderData,
      });
    }

    setActiveId(null);
  };

  const handleDelete = (imageId: number) => {
    deleteImageMutation.mutate({
      blogId,
      articleId,
      imageId,
    });
  };

  const handleUpdateAltText = (imageId: number, altText: string) => {
    updateImageMutation.mutate({
      blogId,
      articleId,
      imageId,
      data: { alt_text: altText },
    });
  };

  const activeImage = sortedImages.find((img) => img.id === activeId);

  if (sortedImages.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No images uploaded yet.</p>
        <p className="text-sm mt-2">Upload images using the form above.</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortedImages.map((img) => img.id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedImages.map((image, index) => (
            <SortableImageCard
              key={image.id}
              image={image}
              index={index}
              blogId={blogId}
              articleId={articleId}
              onDelete={handleDelete}
              onUpdateAltText={handleUpdateAltText}
            />
          ))}
        </div>
      </SortableContext>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeImage ? (
          <Card className="bg-muted opacity-90 rotate-3 scale-105">
            <CardBody className="p-0">
              <div className="relative aspect-video bg-background">
                <Image
                  src={activeImage.url}
                  alt={activeImage.alt_text || "Dragging image"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            </CardBody>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
