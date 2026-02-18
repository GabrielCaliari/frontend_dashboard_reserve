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
      <DialogContent className="sm:max-w-[500px] bg-content1 border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground">Edit Blog</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update blog information. Changes will be reflected immediately.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-foreground">
              Title
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="My Awesome Blog"
              className="bg-content2 border-border text-foreground"
              disabled={isPending}
            />
            {errors.title && (
              <p className="text-sm text-red-400">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug" className="text-foreground">
              Slug
            </Label>
            <Input
              id="slug"
              {...register("slug")}
              placeholder="my-awesome-blog"
              className="bg-content2 border-border text-foreground font-mono text-sm"
              disabled={isPending}
            />
            {errors.slug && (
              <p className="text-sm text-red-400">{errors.slug.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              URL-friendly identifier (lowercase, hyphens only)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Description
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="A brief description of your blog..."
              className="bg-content2 border-border text-foreground min-h-[100px]"
              disabled={isPending}
            />
            {errors.description && (
              <p className="text-sm text-red-400">{errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-foreground">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(value) => setValue("status", value as "active" | "inactive")}
              disabled={isPending}
            >
              <SelectTrigger className="bg-content2 border-border text-foreground">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-content1 border-border">
                <SelectItem value="active" className="text-foreground">
                  Active
                </SelectItem>
                <SelectItem value="inactive" className="text-foreground">
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
              className="text-muted-foreground hover:text-foreground"
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
