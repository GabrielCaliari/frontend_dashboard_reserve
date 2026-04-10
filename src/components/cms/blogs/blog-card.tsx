"use client";

import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  MoreVertical,
  Edit,
  Trash2,
  Key,
  FileText,
  FolderOpen,
  CalendarDays,
  Clock,
} from "lucide-react";
import type { Blog } from "@/src/shared/domain/types/@cms-blog";
import BlogSecretKeyDisplay from "./blog-secret-key-display";

interface BlogCardProps {
  blog: Blog;
  onEdit: () => void;
  onDelete: () => void;
  onRegenerateKey: () => void;
  onViewArticles: () => void;
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export default function BlogCard({
  blog,
  onEdit,
  onDelete,
  onRegenerateKey,
  onViewArticles,
}: BlogCardProps) {
  return (
    <Card className="flex h-full w-full flex-col border border-divider bg-content1 shadow-none rounded-2xl">
      {/* Header */}
      <CardHeader className="flex items-start justify-between gap-3 border-b border-divider px-5 pt-5 pb-4">
        <div className="min-w-0 flex-1 space-y-2.5">
          {/* Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip
              size="sm"
              variant="flat"
              color={blog.active ? "success" : "default"}
            >
              {blog.active ? "Active" : "Inactive"}
            </Chip>
            <Chip
              size="sm"
              variant="flat"
              color={blog.mediaCollectionId ? "primary" : "default"}
              startContent={<FolderOpen size={12} />}
            >
              {blog.mediaCollectionId ? "Collection linked" : "No collection"}
            </Chip>
          </div>

          {/* Name + ID */}
          <div>
            <h3 className="text-base font-semibold text-foreground line-clamp-2 leading-snug">
              {blog.name}
            </h3>
            <span className="text-xs text-foreground-400 font-mono">
              ID #{blog.id}
            </span>
          </div>

          {/* Dates */}
          <div className="flex gap-4 text-xs text-foreground-400">
            <span className="flex items-center gap-1.5">
              <CalendarDays size={12} className="shrink-0" />
              Created {formatDate(blog.created_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={12} className="shrink-0" />
              Updated {formatDate(blog.updated_at)}
            </span>
          </div>
        </div>

        {/* Menu */}
        <Dropdown placement="bottom-end" shouldBlockScroll={false}>
          <DropdownTrigger>
            <Button isIconOnly size="sm" variant="light" aria-label="Actions">
              <MoreVertical size={18} />
            </Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Blog actions">
            <DropdownItem
              key="edit"
              startContent={<Edit size={16} />}
              onPress={onEdit}
            >
              Edit Collection
            </DropdownItem>
            <DropdownItem
              key="articles"
              startContent={<FileText size={16} />}
              onPress={onViewArticles}
            >
              View Articles
            </DropdownItem>
            <DropdownItem
              key="regenerate"
              startContent={<Key size={16} />}
              onPress={onRegenerateKey}
              className="text-warning"
              color="warning"
            >
              Regenerate Key
            </DropdownItem>
            <DropdownItem
              key="delete"
              startContent={<Trash2 size={16} />}
              onPress={onDelete}
              className="text-danger"
              color="danger"
            >
              Delete Collection
            </DropdownItem>
          </DropdownMenu>
        </Dropdown>
      </CardHeader>

      {/* Body */}
      <CardBody className="flex flex-1 flex-col gap-3 px-5 py-4">
        {/* Description */}
        <div className="min-h-[68px] rounded-xl bg-content2 px-4 py-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-foreground-400">
            Description
          </p>
          {blog.description ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-foreground-600">
              {blog.description}
            </p>
          ) : (
            <p className="text-sm italic text-foreground-400">
              No description provided.
            </p>
          )}
        </div>

        <BlogSecretKeyDisplay secretKey={blog.secret_key} />
      </CardBody>

      {/* Footer */}
      <CardFooter className="flex gap-2 border-t border-divider px-5 py-4">
        <Button
          size="sm"
          variant="flat"
          color="primary"
          onPress={onViewArticles}
          className="flex-1"
        >
          Manage Articles
        </Button>
        <Button
          size="sm"
          variant="flat"
          onPress={onEdit}
          startContent={<Edit size={15} />}
        >
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
}
