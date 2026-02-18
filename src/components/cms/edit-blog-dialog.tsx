"use client";

import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useUpdateBlog } from "@/src/common/hooks/cms/use-update-blog";
import { blogUpdateSchema, type BlogUpdateFormData } from "@/src/common/schemas/blog-schema";
import type { Blog } from "@/src/common/@types/@blog";

interface EditBlogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blog: Blog | null;
  onSuccess?: () => void;
}

export function EditBlogDialog({ open, onOpenChange, blog, onSuccess }: EditBlogDialogProps) {
  const { mutate: updateBlog, isPending } = useUpdateBlog(blog?.id || 0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<BlogUpdateFormData>({
    resolver: zodResolver(blogUpdateSchema),
  });

  const status = watch("status");

  useEffect(() => {
    if (blog) {
      reset({
        title: blog.title,
        description: blog.description,
        slug: blog.slug,
        status: blog.status,
      });
    }
  }, [blog, reset]);

  const onSubmit = (data: BlogUpdateFormData) => {
    if (!blog) return;

    updateBlog(data, {
      onSuccess: () => {
        reset();
        onOpenChange(false);
        onSuccess?.();
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#16162a] border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-2xl text-gray-100">Edit Blog</DialogTitle>
          <DialogDescription className="text-gray-400">
            Update blog information. Changes will be reflected immediately.
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

          <div className="space-y-2">
            <Label htmlFor="status" className="text-gray-200">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(value) => setValue("status", value as "active" | "inactive")}
              disabled={isPending}
            >
              <SelectTrigger className="bg-[#1a1a2e] border-gray-700 text-gray-100">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a2e] border-gray-700">
                <SelectItem value="active" className="text-gray-100">
                  Active
                </SelectItem>
                <SelectItem value="inactive" className="text-gray-100">
                  Inactive
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-400">{errors.status.message}</p>
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
                  Updating...
                </>
              ) : (
                "Update Blog"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
