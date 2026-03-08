"use client";

import { useMemo, useState } from "react";
import { Button, Chip, Input, Spinner } from "@heroui/react";
import { Plus, Search, LayoutGrid, RadioTower, CircleOff } from "lucide-react";
import type { Blog } from "@/src/common/@types/@cms-blog";
import BlogCard from "./blog-card";

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
    const withCollection = blogs.filter((blog) => !!blog.mediaCollectionId).length;

    return {
      total: blogs.length,
      active,
      inactive,
      withCollection,
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" label="Loading blogs..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.1),_transparent_24%),linear-gradient(180deg,_rgba(255,255,255,0.03),_rgba(255,255,255,0.01))] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.24)] sm:p-6 lg:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-default-500">
              <LayoutGrid size={14} />
              Content hubs
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Blogs
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-default-500 sm:text-base">
                Manage your content blogs and articles with a clearer operational view, faster scanning, and better mobile ergonomics.
              </p>
            </div>
          </div>

          <Button
            color="primary"
            startContent={<Plus size={20} />}
            onPress={onCreateClick}
            className="w-full sm:w-auto"
          >
            Create Blog
          </Button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-default-400">Total blogs</div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{summary.total}</div>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-emerald-200">
              <RadioTower size={14} />
              Active
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{summary.active}</div>
          </div>
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-amber-100">
              <CircleOff size={14} />
              Inactive
            </div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{summary.inactive}</div>
          </div>
          <div className="rounded-2xl border border-sky-300/20 bg-sky-300/10 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-sky-100">Collections linked</div>
            <div className="mt-2 text-2xl font-semibold text-foreground">{summary.withCollection}</div>
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-[24px] border border-white/10 bg-black/10 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-md">
            <Input
              value={query}
              onValueChange={setQuery}
              placeholder="Search by name or description"
              startContent={<Search size={16} className="text-default-400" />}
              classNames={{
                inputWrapper: "border border-white/10 bg-white/5 shadow-none",
              }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip
              as="button"
              variant={statusFilter === "all" ? "solid" : "flat"}
              color={statusFilter === "all" ? "primary" : "default"}
              onClick={() => setStatusFilter("all")}
              className="cursor-pointer px-3"
            >
              All
            </Chip>
            <Chip
              as="button"
              variant={statusFilter === "active" ? "solid" : "flat"}
              color={statusFilter === "active" ? "success" : "default"}
              onClick={() => setStatusFilter("active")}
              className="cursor-pointer px-3"
            >
              Active
            </Chip>
            <Chip
              as="button"
              variant={statusFilter === "inactive" ? "solid" : "flat"}
              color={statusFilter === "inactive" ? "warning" : "default"}
              onClick={() => setStatusFilter("inactive")}
              className="cursor-pointer px-3"
            >
              Inactive
            </Chip>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-default-500">
          <p>
            Showing <span className="font-medium text-foreground">{filteredBlogs.length}</span> of <span className="font-medium text-foreground">{blogs.length}</span> blogs
          </p>
          {(query || statusFilter !== "all") && (
            <Button
              size="sm"
              variant="light"
              onPress={() => {
                setQuery("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </section>

      {blogs.length === 0 ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-white/10 bg-black/10 px-6 text-center">
          <p className="mb-2 text-lg font-medium text-foreground">No blogs yet</p>
          <p className="mb-5 max-w-md text-sm text-default-500">
            Create your first blog to start organizing articles, media collections, and public publishing credentials.
          </p>
          <Button
            color="primary"
            startContent={<Plus size={20} />}
            onPress={onCreateClick}
          >
            Create Your First Blog
          </Button>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center rounded-[24px] border border-white/10 bg-black/10 px-6 text-center">
          <p className="mb-2 text-lg font-medium text-foreground">No matching blogs</p>
          <p className="max-w-md text-sm text-default-500">
            Adjust the search terms or filters to broaden the result set.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
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
