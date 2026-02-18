"use client";

import { useState } from "react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { AlertCircle, Globe, Sparkles } from "lucide-react";
import { Card, CardBody } from "@nextui-org/react";
import { BlogList } from "@/src/components/cms/blogs";
import { useListBlogs } from "@/src/common/hooks/cms/use-list-blogs";
import { useDeleteBlog } from "@/src/common/hooks/cms/use-delete-blog";
import { useRegenerateSecretKey } from "@/src/common/hooks/cms/use-regenerate-secret-key";
import { CreateBlogDialog } from "@/src/components/cms/create-blog-dialog";
import { EditBlogDialog } from "@/src/components/cms/edit-blog-dialog";
import { SecretKeyDialog } from "@/src/components/cms/secret-key-dialog";
import { useHasSelectedTenant, useTenantStore } from "@/src/common/stores/tenant-store";
import type { Blog } from "@/src/common/@types/@blog";

export default function BlogsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    blog: Blog | null;
  }>({ open: false, blog: null });
  const [secretKeyDialog, setSecretKeyDialog] = useState<{
    open: boolean;
    secretKey: string;
    blogTitle: string;
  }>({ open: false, secretKey: "", blogTitle: "" });

  const hasSelectedTenant = useHasSelectedTenant();
  const selectedTenant = useTenantStore((state) => state.selectedTenant);
  const { data: blogsData, isLoading, error } = useListBlogs(1, 50);
  const { mutate: deleteBlog } = useDeleteBlog();
  const { mutate: regenerateKey } = useRegenerateSecretKey();

  const handleCreateSuccess = (blog: Blog & { secret_key?: string }) => {
    if (blog.secret_key) {
      setSecretKeyDialog({
        open: true,
        secretKey: blog.secret_key,
        blogTitle: blog.name,
      });
    }
  };

  const handleDelete = (blog: Blog) => {
    if (confirm(`Are you sure you want to delete "${blog.name}"? This action cannot be undone.`)) {
      deleteBlog(blog.id);
    }
  };

  const handleRegenerateKey = (blog: Blog) => {
    if (
      confirm(
        `Regenerate secret key for "${blog.name}"? The old key will be immediately invalidated.`
      )
    ) {
      regenerateKey(blog.id, {
        onSuccess: (data) => {
          setSecretKeyDialog({
            open: true,
            secretKey: data.secret_key,
            blogTitle: blog.name,
          });
        },
      });
    }
  };

  // Show tenant selection warning
  if (!hasSelectedTenant) {
    return (
      <LayoutScopeRoot routeActive="blogs">
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <Card className="max-w-md border-warning-200 bg-warning-50">
              <CardBody className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-warning-100 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-warning-600" />
                </div>
                <h3 className="text-xl font-semibold text-warning-900 mb-2">
                  No Tenant Selected
                </h3>
                <p className="text-warning-700">
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
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            Blogs Management
          </h1>
          <p className="text-default-500">
            Managing blogs for: <span className="font-semibold text-primary">{selectedTenant?.name}</span>
          </p>
        </div>

        {error ? (
          <Card className="border-danger-200 bg-danger-50">
            <CardBody className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-danger-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-danger-600" />
              </div>
              <h3 className="text-xl font-semibold text-danger-900 mb-2">Error loading blogs</h3>
              <p className="text-danger-700">{error instanceof Error ? error.message : 'Unknown error'}</p>
            </CardBody>
          </Card>
        ) : (
          <BlogList
            blogs={blogsData?.data || []}
            isLoading={isLoading}
            onCreateClick={() => setCreateDialogOpen(true)}
            onEditClick={(blog) => setEditDialog({ open: true, blog })}
            onDeleteClick={handleDelete}
            onRegenerateKeyClick={handleRegenerateKey}
          />
        )}
      </div>

      <CreateBlogDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleCreateSuccess}
      />

      <EditBlogDialog
        open={editDialog.open}
        onOpenChange={(open) => setEditDialog({ ...editDialog, open })}
        blog={editDialog.blog}
      />

      <SecretKeyDialog
        open={secretKeyDialog.open}
        onOpenChange={(open) => setSecretKeyDialog({ ...secretKeyDialog, open })}
        secretKey={secretKeyDialog.secretKey}
        blogTitle={secretKeyDialog.blogTitle}
      />
    </LayoutScopeRoot>
  );
}
