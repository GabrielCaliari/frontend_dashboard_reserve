"use client";

import { useState } from "react";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { FileText, Plus, Edit, Trash2, Globe, Key, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
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
  const { data: blogsData, isLoading } = useListBlogs(1, 50);
  const { mutate: deleteBlog, isPending: isDeleting } = useDeleteBlog();
  const { mutate: regenerateKey, isPending: isRegenerating } = useRegenerateSecretKey();

  const handleCreateSuccess = (blog: Blog & { secret_key?: string }) => {
    if (blog.secret_key) {
      setSecretKeyDialog({
        open: true,
        secretKey: blog.secret_key,
        blogTitle: blog.title,
      });
    }
  };

  const handleDelete = (blogId: number, blogTitle: string) => {
    if (confirm(`Are you sure you want to delete "${blogTitle}"? This action cannot be undone.`)) {
      deleteBlog(blogId);
    }
  };

  const handleRegenerateKey = (blogId: number, blogTitle: string) => {
    if (
      confirm(
        `Regenerate secret key for "${blogTitle}"? The old key will be immediately invalidated.`
      )
    ) {
      regenerateKey(blogId, {
        onSuccess: (data) => {
          setSecretKeyDialog({
            open: true,
            secretKey: data.secret_key,
            blogTitle,
          });
        },
      });
    }
  };

  // Show tenant selection warning
  if (!hasSelectedTenant) {
    return (
      <LayoutScopeRoot routeActive="blogs">
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <Card className="bg-yellow-500/10 border-yellow-500/20 max-w-md">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-yellow-400 mb-2">
                  No Tenant Selected
                </h3>
                <p className="text-gray-400">
                  Please select a tenant from the sidebar to manage blogs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <LayoutScopeRoot routeActive="blogs">
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-100 flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-500" />
              Blogs Management
            </h1>
            <p className="text-gray-400 mt-2">
              Managing blogs for: <span className="text-blue-400 font-semibold">{selectedTenant?.name}</span>
            </p>
          </div>

          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setCreateDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Blog
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !blogsData || !blogsData.data || blogsData.data.length === 0 ? (
          <div className="text-center py-12">
            <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No blogs yet</h3>
            <p className="text-gray-500 mb-6">Create your first blog to get started</p>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => setCreateDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Blog
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogsData?.data.map((blog) => (
              <Card
                key={blog.id}
                className="bg-[#16162a] border-gray-800 hover:border-gray-700 transition-all shadow-lg group"
              >
                <CardContent className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-100 group-hover:text-blue-400 transition-colors">
                        {blog.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          blog.status === "active"
                            ? "bg-green-500/10 text-green-400"
                            : "bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {blog.status}
                      </span>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 line-clamp-2 min-h-[40px]">
                    {blog.description}
                  </p>

                  <div className="flex items-center gap-2 py-4 border-t border-gray-800/50">
                    <div className="text-xs text-gray-500 font-mono truncate">
                      /{blog.slug}
                    </div>
                  </div>

                  <div className="flex justify-between gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                      onClick={() => handleRegenerateKey(blog.id, blog.title)}
                      disabled={isRegenerating}
                    >
                      <Key className="w-4 h-4 mr-2" />
                      Key
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-white hover:bg-white/5"
                        onClick={() => setEditDialog({ open: true, blog })}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        onClick={() => handleDelete(blog.id, blog.title)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
