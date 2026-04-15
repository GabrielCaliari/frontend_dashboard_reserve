"use client";

import { CmsPageLayout } from "@/src/components/cms/shared/cms-page-layout";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { ConfirmationDialog } from "@/src/components/access-management/shared/confirmation-dialog";
import { Card, CardBody } from "@heroui/react";
import { BlogList, BlogForm } from "@/src/components/cms/blogs";
import { SecretKeyDialog } from "@/src/components/cms/secret-key-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/presentation/components/atoms/shadcn-ui/sheet";
import { useBlogs } from "@/src/common/hooks/cms/useBlogs";
import {
  useCreateBlog,
  useUpdateBlog,
  useDeleteBlog,
  useRegenerateBlogKey,
} from "@/src/common/hooks/cms/useBlogMutations";
import { useHasSelectedTenant } from "@/src/shared/stores/tenant-store";
import type {
  Blog,
  CreateBlogDto,
  UpdateBlogDto,
} from "@/src/shared/domain/types/@cms-blog";

export default function BlogsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSecretKeyOpen, setIsSecretKeyOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | undefined>(undefined);
  const [secretKeyTargetBlog, setSecretKeyTargetBlog] = useState<Blog | null>(
    null,
  );
  const [generatedSecretKey, setGeneratedSecretKey] = useState<string | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<Blog | null>(null);

  const hasSelectedTenant = useHasSelectedTenant();

  const { data: blogsData, isLoading } = useBlogs();
  const createBlogMutation = useCreateBlog();
  const updateBlogMutation = useUpdateBlog();
  const deleteBlogMutation = useDeleteBlog();
  const regenerateKeyMutation = useRegenerateBlogKey();

  // Normalize blogs array
  const blogs: Blog[] = Array.isArray(blogsData) ? blogsData : [];

  const handleFormOpenChange = (open: boolean) => {
    setIsFormOpen(open);
    if (!open) {
      setSelectedBlog(undefined);
    }
  };

  const handleSecretKeyOpenChange = (open: boolean) => {
    if (!regenerateKeyMutation.isPending) {
      setIsSecretKeyOpen(open);
    }

    if (!open && !regenerateKeyMutation.isPending) {
      setGeneratedSecretKey(null);
      setSecretKeyTargetBlog(null);
    }
  };

  const handleCreateClick = () => {
    setSelectedBlog(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (blog: Blog) => {
    setSelectedBlog(blog);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (blog: Blog) => {
    setDeleteTarget(blog);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBlogMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (error) {
      // Error is handled by mutation
    }
  };

  const handleRegenerateKeyClick = (blog: Blog) => {
    setSecretKeyTargetBlog(blog);
    setGeneratedSecretKey(null);
    setIsSecretKeyOpen(true);
  };

  const handleConfirmRegenerateKey = async () => {
    if (!secretKeyTargetBlog) {
      return;
    }

    try {
      const updatedBlog = await regenerateKeyMutation.mutateAsync(
        secretKeyTargetBlog.id,
      );
      setGeneratedSecretKey(updatedBlog.secret_key);
      setSecretKeyTargetBlog(updatedBlog);
    } catch (error) {
      // Error is handled by mutation
    }
  };

  const handleSubmit = async (data: CreateBlogDto | UpdateBlogDto) => {
    try {
      if (selectedBlog) {
        await updateBlogMutation.mutateAsync({
          blogId: selectedBlog.id,
          data: data as UpdateBlogDto,
        });
      } else {
        const createdBlog = await createBlogMutation.mutateAsync(
          data as CreateBlogDto,
        );
        setSecretKeyTargetBlog(createdBlog);
        setGeneratedSecretKey(createdBlog.secret_key);
        setIsSecretKeyOpen(true);
      }

      handleFormOpenChange(false);
    } catch (error) {
      // Error is handled by mutation
    }
  };

  // Show tenant selection warning
  if (!hasSelectedTenant) {
    return (
      <CmsPageLayout routeActive="blogs">
        <div className="flex flex-col items-center justify-center py-16">
          <Card className="max-w-md border-warning/20 bg-warning/5 shadow-none">
            <CardBody className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No Tenant Selected
              </h3>
              <p className="text-muted-foreground">
                Please select a tenant from the sidebar to manage blog
                collections.
              </p>
            </CardBody>
          </Card>
        </div>
      </CmsPageLayout>
    );
  }

  return (
    <CmsPageLayout routeActive="blogs">
      <BlogList
        blogs={blogs}
        isLoading={isLoading}
        onCreateClick={handleCreateClick}
        onEditClick={handleEditClick}
        onDeleteClick={handleDeleteClick}
        onRegenerateKeyClick={handleRegenerateKeyClick}
      />

      <Sheet open={isFormOpen} onOpenChange={handleFormOpenChange}>
        <SheetContent className="flex h-full w-full flex-col overflow-hidden border-border bg-background p-0 sm:max-w-2xl">
          <SheetHeader className="border-b border-border px-6 py-4 text-left">
            <SheetTitle>
              {selectedBlog ? "Edit Collection" : "Create Collection"}
            </SheetTitle>
            <SheetDescription>
              {selectedBlog
                ? "Update collection metadata, media integration, and availability."
                : "Create a new collection and generate its first secret key."}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <BlogForm
              blog={selectedBlog}
              onSubmit={handleSubmit}
              onCancel={() => handleFormOpenChange(false)}
              isSubmitting={
                createBlogMutation.isPending || updateBlogMutation.isPending
              }
            />
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Collection"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This will permanently delete all articles and images.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleteBlogMutation.isPending}
      />

      <SecretKeyDialog
        open={isSecretKeyOpen}
        onOpenChange={handleSecretKeyOpenChange}
        secretKey={generatedSecretKey}
        blogTitle={secretKeyTargetBlog?.name ?? "Selected Collection"}
        onConfirmRegenerate={
          generatedSecretKey ? undefined : handleConfirmRegenerateKey
        }
        isPending={regenerateKeyMutation.isPending}
      />
    </CmsPageLayout>
  );
}
