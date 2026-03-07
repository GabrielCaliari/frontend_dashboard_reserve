"use client";

import {
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { MoreVertical, Edit, Trash2, Eye, Archive, Send } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { Article } from "@/src/common/@types/@cms-article";
import ArticleStatusBadge from "./article-status-badge";

interface ArticleTableRowProps {
  article: Article;
  onEdit: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onArchive: () => void;
  onPreview?: () => void;
  isDragging?: boolean;
}

/**
 * ArticleTableRow Component
 *
 * Displays a single article in a table row with contextual actions.
 *
 * Features:
 * - Article title, slug, and status badge
 * - Publication date and last updated timestamp
 * - Contextual action buttons based on article status
 * - Drag handle for reordering (using @dnd-kit)
 * - Dropdown menu for additional actions
 *
 * Action visibility by status:
 * - Draft: Edit, Delete, Publish, Preview
 * - Published: Edit, Archive, Preview
 * - Archived: Edit, Delete, Preview
 *
 * **Validates: Requirements 17.1, 17.6, 17.7**
 */
export default function ArticleTableRow({
  article,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
  onPreview,
  isDragging = false,
}: ArticleTableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: article.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Format dates
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Determine available actions based on status
  const canPublish = article.status === "draft";
  const canArchive = article.status === "published";
  const canDelete = article.status === "draft" || article.status === "archived";

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="group hover:bg-accent transition-all duration-200"
    >
      {/* Drag Handle */}
      <td className="px-3 py-4">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-default-300 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
          aria-label="Drag to reorder"
        >
          <GripVertical size={18} />
        </button>
      </td>

      {/* Title */}
      <td className="px-4 py-4">
        <div className="flex flex-col gap-1 min-w-0">
          <span className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {article.title}
          </span>
          <span className="text-xs text-default-400 font-mono truncate">
            /{article.slug}
          </span>
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-4">
        <ArticleStatusBadge status={article.status} />
      </td>

      {/* Published Date */}
      <td className="px-4 py-4">
        <span className="text-sm text-default-600 whitespace-nowrap">
          {formatDate(article.published_at)}
        </span>
      </td>

      {/* Last Updated */}
      <td className="px-4 py-4">
        <span className="text-sm text-default-600 whitespace-nowrap">
          {formatDate(article.updated_at)}
        </span>
      </td>

      {/* Actions */}
      <td className="px-4 py-4">
        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Quick Actions */}
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            onPress={onEdit}
            aria-label="Edit article"
            className="hover:bg-accent hover:text-accent-foreground"
          >
            <Edit size={16} />
          </Button>

          {onPreview && (
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={onPreview}
              aria-label="Preview article"
              className="hover:bg-accent hover:text-accent-foreground"
            >
              <Eye size={16} />
            </Button>
          )}

          {/* More Actions Dropdown */}
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                aria-label="More actions"
                className="hover:bg-accent hover:text-accent-foreground"
              >
                <MoreVertical size={16} />
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Article actions"
              classNames={{
                base: "min-w-[160px]",
              }}
            >
              {canPublish && (
                <DropdownItem
                  key="publish"
                  startContent={<Send size={16} />}
                  onPress={onPublish}
                  color="success"
                  className="text-success"
                >
                  Publish Article
                </DropdownItem>
              )}

              {canArchive && (
                <DropdownItem
                  key="archive"
                  startContent={<Archive size={16} />}
                  onPress={onArchive}
                  color="warning"
                  className="text-warning"
                >
                  Archive Article
                </DropdownItem>
              )}

              {canDelete && (
                <DropdownItem
                  key="delete"
                  startContent={<Trash2 size={16} />}
                  onPress={onDelete}
                  color="danger"
                  className="text-danger"
                >
                  Delete Article
                </DropdownItem>
              )}
            </DropdownMenu>
          </Dropdown>
        </div>
      </td>
    </tr>
  );
}
