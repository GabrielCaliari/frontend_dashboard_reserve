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
import {
  blogCreateSchema,
  type BlogCreateFormData,
} from "@/src/shared/schemas/blog-schema";
import type { Blog } from "@/src/shared/domain/types/@cms-blog";

interface CreateBlogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (blog: Blog & { secret_key?: string }) => void;
}

export function CreateBlogDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateBlogDialogProps) {
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
      <DialogContent className="sm:max-w-[500px] bg-content1 border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl text-foreground">
            Create New Blog
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a new blog to publish articles. A secret key will be
            generated for API access.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">
              Blog Name
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="My Awesome Blog"
              className="bg-content2 border-border text-foreground"
              disabled={isPending}
              maxLength={150}
            />
            {errors.name && (
              <p className="text-sm text-red-400">{errors.name.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Maximum 150 characters. Slug will be auto-generated.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-foreground">
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="A brief description of your blog..."
              className="bg-content2 border-border text-foreground min-h-[100px]"
              disabled={isPending}
            />
            {errors.description && (
              <p className="text-sm text-red-400">
                {errors.description.message}
              </p>
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
