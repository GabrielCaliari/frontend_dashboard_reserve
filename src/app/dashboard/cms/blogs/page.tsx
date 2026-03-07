"use client";

import { useState } from "react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { AlertCircle } from "lucide-react";
import {
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@heroui/react";
import { BlogList, BlogForm } from "@/src/components/cms/blogs";
import { useBlogs } from "@/src/common/hooks/cms/useBlogs";
import {
  useCreateBlog,
  useUpdateBlog,
  useDeleteBlog,
  useRegenerateBlogKey,
} from "@/src/common/hooks/cms/useBlogMutations";
import { useHasSelectedTenant } from "@/src/common/stores/tenant-store";
import type {
  Blog,
  CreateBlogDto,
  UpdateBlogDto,
} from "@/src/common/@types/@cms-blog";

export default function BlogsPage() {
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [selectedBlog, setSelectedBlog] = useState<Blog | undefined>(undefined);

  const hasSelectedTenant = useHasSelectedTenant();

  const { data: blogsData, isLoading } = useBlogs();
  const createBlogMutation = useCreateBlog();
  const updateBlogMutation = useUpdateBlog();
  const deleteBlogMutation = useDeleteBlog();
  const regenerateKeyMutation = useRegenerateBlogKey();

  // Normalize blogs array
  const blogs: Blog[] = Array.isArray(blogsData) ? blogsData : [];

  const handleCreateClick = () => {
    setSelectedBlog(undefined);
    onOpen();
  };

  const handleEditClick = (blog: Blog) => {
    setSelectedBlog(blog);
    onOpen();
  };

  const handleDeleteClick = async (blog: Blog) => {
    if (
      confirm(
        `Are you sure you want to delete "${blog.name}"? This will delete all articles and images.`,
      )
    ) {
      try {
        await deleteBlogMutation.mutateAsync(blog.id);
      } catch (error) {
        // Error is handled by mutation
      }
    }
  };

  const handleRegenerateKeyClick = async (blog: Blog) => {
    if (confirm("This will invalidate the current key. Continue?")) {
      try {
        await regenerateKeyMutation.mutateAsync(blog.id);
      } catch (error) {
        // Error is handled by mutation
      }
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
        await createBlogMutation.mutateAsync(data as CreateBlogDto);
      }
      onClose();
    } catch (error) {
      // Error is handled by mutation
    }
  };

  // Show tenant selection warning
  if (!hasSelectedTenant) {
    return (
      <LayoutScopeRoot routeActive="blogs">
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <Card className="max-w-md border-warning/20 bg-warning/5">
              <CardBody className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-warning" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No Tenant Selected
                </h3>
                <p className="text-muted-foreground">
                  Please select a tenant from the sidebar to manage blogs.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <LayoutScopeRoot routeActive="blogs">
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        <BlogList
          blogs={blogs}
          isLoading={isLoading}
          onCreateClick={handleCreateClick}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
          onRegenerateKeyClick={handleRegenerateKeyClick}
        />

        <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  {selectedBlog ? "Edit Blog" : "Create Blog"}
                </ModalHeader>
                <ModalBody className="pb-6">
                  <BlogForm
                    blog={selectedBlog}
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                    isSubmitting={
                      createBlogMutation.isPending ||
                      updateBlogMutation.isPending
                    }
                  />
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </LayoutScopeRoot>
  );
}
