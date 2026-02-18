'use client';

import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Article, ReorderArticleDto } from '@/src/common/@types/@cms-article';

interface ArticleReorderProps {
  articles: Article[];
  onReorder: (reorderedArticles: ReorderArticleDto[]) => void;
  children: (article: Article, isDragging: boolean) => React.ReactNode;
}

/**
 * ArticleReorder Component
 * 
 * Provides drag-and-drop functionality for reordering articles using @dnd-kit.
 * 
 * Features:
 * - Drag-and-drop reordering with visual feedback
 * - Keyboard navigation support for accessibility
 * - Automatic display_order calculation on drop
 * - Triggers reorder mutation on completion
 * - Optimistic UI updates
 * 
 * Usage:
 * ```tsx
 * <ArticleReorder articles={articles} onReorder={handleReorder}>
 *   {(article, isDragging) => (
 *     <ArticleTableRow
 *       article={article}
 *       isDragging={isDragging}
 *       {...handlers}
 *     />
 *   )}
 * </ArticleReorder>
 * ```
 * 
 * **Validates: Requirements 17.5**
 */
export default function ArticleReorder({
  articles,
  onReorder,
  children,
}: ArticleReorderProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [items, setItems] = useState(articles);

  // Configure sensors for drag interactions
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Update items when articles prop changes
  if (articles !== items && !activeId) {
    setItems(articles);
  }

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Reorder the items array
    const reorderedItems = arrayMove(items, oldIndex, newIndex);
    setItems(reorderedItems);

    // Create the reorder payload with new display_order values
    const reorderPayload: ReorderArticleDto[] = reorderedItems.map((item, index) => ({
      id: item.id,
      display_order: index,
    }));

    // Trigger the reorder mutation
    onReorder(reorderPayload);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((article) => (
          <div key={article.id}>
            {children(article, activeId === article.id)}
          </div>
        ))}
      </SortableContext>
    </DndContext>
  );
}
