"use client";

import { useMemo, useState } from "react";
import { Button, Spinner } from "@heroui/react";
import { Plus, LayoutGrid } from "lucide-react";
import type { Blog } from "@/src/common/@types/@cms-blog";
import BlogCard from "./blog-card";
import { CmsPageHeader, CmsTabItem } from "../shared/cms-page-header";

interface BlogListProps {
  blogs: Blog[];
  isLoading: boolean;
  onCreateClick: () => void;
  onEditClick: (blog: Blog) => void;
  onDeleteClick: (blog: Blog) => void;
  onRegenerateKeyClick: (blog: Blog) => void;
}

export default function BlogList({
  blogs,
  isLoading,
  onCreateClick,
  onEditClick,
  onDeleteClick,
  onRegenerateKeyClick,
}: BlogListProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const summary = useMemo(() => {
    const active = blogs.filter((blog) => blog.active).length;
    const inactive = blogs.length - active;

    return {
      all: blogs.length,
      active,
      inactive,
    };
  }, [blogs]);

  const filteredBlogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return blogs.filter((blog) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && blog.active) ||
        (statusFilter === "inactive" && !blog.active);

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [blog.name, blog.description ?? ""]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [blogs, query, statusFilter]);

  const tabs: CmsTabItem[] = [
    { id: "all", label: "All", count: summary.all },
    { id: "active", label: "Active", count: summary.active, color: "success" },
    { id: "inactive", label: "Inactive", count: summary.inactive, color: "warning" },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" label="Loading blog collections..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CmsPageHeader
        title="Blog Collections"
        description="Manage your content hubs with a clearer operational view."
        icon={<LayoutGrid className="w-6 h-6" />}
        actionLabel="Create Collection"
        actionIcon={<Plus size={20} />}
        onActionClick={onCreateClick}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search by name or description..."
        tabs={tabs}
        activeTab={statusFilter}
        onTabChange={(id) => setStatusFilter(id as any)}
      />

      {blogs.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[24px] border border-dashed border-border bg-default-50 px-6 text-center">
          <p className="mb-2 text-lg font-medium text-foreground">No collections yet</p>
          <p className="mb-5 max-w-md text-sm text-muted-foreground">
            Create your first blog collection to start organizing articles, media, and public credentials.
          </p>
          <Button
            color="primary"
            startContent={<Plus size={20} />}
            onPress={onCreateClick}
          >
            Create Your First Collection
          </Button>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[24px] border border-border bg-default-50 px-6 text-center">
          <p className="mb-2 text-lg font-medium text-foreground">No matching collections</p>
          <p className="max-w-md text-sm text-muted-foreground">
            Adjust the search terms or filters to broaden the result set.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredBlogs.map((blog) => (
            <BlogCard
              key={blog.id}
              blog={blog}
              onEdit={() => onEditClick(blog)}
              onDelete={() => onDeleteClick(blog)}
              onRegenerateKey={() => onRegenerateKeyClick(blog)}
              onViewArticles={() => {
                window.location.href = `/dashboard/cms/articles?blogId=${blog.id}`;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
