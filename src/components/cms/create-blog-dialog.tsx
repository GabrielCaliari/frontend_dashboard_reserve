"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { useCreateBlog } from "@/src/common/hooks/cms/use-create-blog";
import { blogCreateSchema, type BlogCreateFormData } from "@/src/common/schemas/blog-schema";
import type { Blog } from "@/src/common/@types/@blog";

interface CreateBlogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (blog: Blog & { secret_key?: string }) => void;
}

export function CreateBlogDialog({ open, onOpenChange, onSuccess }: CreateBlogDialogProps) {
  const { mutate: createBlog, isPending } = useCreateBlog();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<BlogCreateFormData>({
    resolver: zodResolver(blogCreateSchema),
  });

  const title = watch("title");

  // Auto-generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    setValue("slug", slug);
  };

  const onSubmit = (data: BlogCreateFormData) => {
    createBlog(data, {
      onSuccess: (blog) => {
        reset();
        onOpenChange(false);
        onSuccess?.(blog);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#16162a] border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-100">Create New Blog</DialogTitle>
          <DialogDescription className="text-gray-400">
            Create a new blog to publish articles. A secret key will be generated for API access.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-200">
              Title
            </Label>
            <Input
              id="title"
              {...register("title")}
              onChange={(e) => {
                register("title").onChange(e);
                handleTitleChange(e);
              }}
              placeholder="My Awesome Blog"
              className="bg-[#1a1a2e] border-gray-700 text-gray-100"
              disabled={isPending}
            />
            {errors.title && (
              <p className="text-sm text-red-400">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="text-gray-200">
              Slug
            </Label>
            <Input
              id="slug"
              {...register("slug")}
              placeholder="my-awesome-blog"
              className="bg-[#1a1a2e] border-gray-700 text-gray-100 font-mono text-sm"
              disabled={isPending}
            />
            {errors.slug && (
              <p className="text-sm text-red-400">{errors.slug.message}</p>
            )}
            <p className="text-xs text-gray-500">
              URL-friendly identifier (lowercase, hyphens only)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-200">
              Description
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="A brief description of your blog..."
              className="bg-[#1a1a2e] border-gray-700 text-gray-100 min-h-[100px]"
              disabled={isPending}
            />
            {errors.description && (
              <p className="text-sm text-red-400">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
              disabled={isPending}
              className="text-gray-400 hover:text-gray-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Blog"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
