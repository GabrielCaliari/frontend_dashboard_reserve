"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type {
  Article,
  ReorderArticleDto,
} from "@/src/common/@types/@cms-article";

interface ArticleDndProviderProps {
  articles: Article[];
  onReorder: (reorderedArticles: ReorderArticleDto[]) => void;
  children: React.ReactNode;
}

interface ArticleSortableListProps {
  articles: Article[];
  children: (article: Article, isDragging: boolean) => React.ReactNode;
}

/**
 * ArticleDndProvider Component
 *
 * Provides the DndContext for drag-and-drop reordering.
 * Must wrap the entire table (outside <table>) to avoid invalid
 * HTML nesting (DndContext renders hidden <div> elements).
 *
 * **Validates: Requirements 17.5**
 */
export function ArticleDndProvider({
  articles,
  onReorder,
  children,
}: ArticleDndProviderProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const [items, setItems] = useState(articles);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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

    const reorderedItems = arrayMove(items, oldIndex, newIndex);
    setItems(reorderedItems);

    const reorderPayload: ReorderArticleDto[] = reorderedItems.map(
      (item, index) => ({
        id: item.id,
        display_order: index,
      }),
    );

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
      {children}
    </DndContext>
  );
}

/**
 * ArticleSortableList Component
 *
 * Renders the SortableContext inside <tbody>.
 * SortableContext is a pure React context provider (no DOM elements),
 * so it's safe to use inside <tbody>.
 *
 * **Validates: Requirements 17.5**
 */
export function ArticleSortableList({
  articles,
  children,
}: ArticleSortableListProps) {
  return (
    <SortableContext
      items={articles.map((item) => item.id)}
      strategy={verticalListSortingStrategy}
    >
      {articles.map((article) => children(article, false))}
    </SortableContext>
  );
}

// Keep default export for backward compatibility
export default ArticleDndProvider;
