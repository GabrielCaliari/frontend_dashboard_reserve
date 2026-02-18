"use client";

import { useParams, useRouter } from "next/navigation";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { ArrowLeft, FileText, Edit, Trash2, Key, Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { useGetBlog } from "@/src/common/hooks/cms/use-get-blog";
import { useListArticles } from "@/src/common/hooks/cms/use-list-articles";
import { useDeleteBlog } from "@/src/common/hooks/cms/use-delete-blog";
import { useRegenerateSecretKey } from "@/src/common/hooks/cms/use-regenerate-secret-key";
import { EditBlogDialog } from "@/src/components/cms/edit-blog-dialog";
import { SecretKeyDialog } from "@/src/components/cms/secret-key-dialog";
import { useState } from "react";
import type { Blog } from "@/src/common/@types/@blog";

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const blogId = Number(params.blogId);

  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    blog: Blog | null;
  }>({ open: false, blog: null });
  const [secretKeyDialog, setSecretKeyDialog] = useState<{
    open: boolean;
    secretKey: string;
    blogTitle: string;
  }>({ open: false, secretKey: "", blogTitle: "" });

  const { data: blog, isLoading: isBlogLoading } = useGetBlog(blogId);
  const { data: articlesData, isLoading: isArticlesLoading } = useListArticles(blogId, 1, 100);
  const { mutate: deleteBlog, isPending: isDeleting } = useDeleteBlog();
  const { mutate: regenerateKey, isPending: isRegenerating } = useRegenerateSecretKey();

  const handleDelete = () => {
    if (blog && confirm(`Are you sure you want to delete "${blog.title}"? This action cannot be undone.`)) {
      deleteBlog(blogId, {
        onSuccess: () => {
          router.push("/dashboard/cms/blogs");
        },
      });
    }
  };

  const handleRegenerateKey = () => {
    if (blog && confirm(`Regenerate secret key for "${blog.title}"? The old key will be immediately invalidated.`)) {
      regenerateKey(blogId, {
        onSuccess: (data) => {
          setSecretKeyDialog({
            open: true,
            secretKey: data.secret_key,
            blogTitle: blog.title,
          });
        },
      });
    }
  };

  const handleViewArticles = () => {
    router.push(`/dashboard/cms/articles?blogId=${blogId}`);
  };

  if (isBlogLoading) {
    return (
      <LayoutScopeRoot routeActive="blogs">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </LayoutScopeRoot>
    );
  }

  if (!blog) {
    return (
      <LayoutScopeRoot routeActive="blogs">
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <Card className="bg-red-500/10 border-red-500/20 max-w-md">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-red-400 mb-2">Blog Not Found</h3>
                <p className="text-gray-400 mb-4">The blog you're looking for doesn't exist.</p>
                <Button onClick={() => router.push("/dashboard/cms/blogs")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Blogs
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  const articles = articlesData?.data || [];
  const draftCount = articles.filter((a) => a.status === "draft").length;
  const publishedCount = articles.filter((a) => a.status === "published").length;
  const archivedCount = articles.filter((a) => a.status === "archived").length;

  return (
    <LayoutScopeRoot routeActive="blogs">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/cms/blogs")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-100">{blog.title}</h1>
              <p className="text-gray-400 mt-1">/{blog.slug}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setEditDialog({ open: true, blog })}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={handleRegenerateKey}
              disabled={isRegenerating}
            >
              <Key className="w-4 h-4 mr-2" />
              Regenerate Key
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Blog Info */}
        <Card className="bg-[#16162a] border-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-100">Blog Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Description</label>
              <p className="text-gray-200 mt-1">{blog.description || "No description provided"}</p>
            </div>
            <div>
              <label className="text-sm text-gray-400">Status</label>
              <div className="mt-1">
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
            </div>
            <div>
              <label className="text-sm text-gray-400">Created</label>
              <p className="text-gray-200 mt-1">
                {new Date(blog.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Article Statistics */}
        <Card className="bg-[#16162a] border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-gray-100">Article Statistics</CardTitle>
            <Button onClick={handleViewArticles}>
              <FileText className="w-4 h-4 mr-2" />
              View All Articles
            </Button>
          </CardHeader>
          <CardContent>
            {isArticlesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#1a1a2e] p-4 rounded-lg border border-gray-800">
                  <div className="text-2xl font-bold text-gray-100">{articles.length}</div>
                  <div className="text-sm text-gray-400 mt-1">Total Articles</div>
                </div>
                <div className="bg-[#1a1a2e] p-4 rounded-lg border border-gray-800">
                  <div className="text-2xl font-bold text-yellow-400">{draftCount}</div>
                  <div className="text-sm text-gray-400 mt-1">Drafts</div>
                </div>
                <div className="bg-[#1a1a2e] p-4 rounded-lg border border-gray-800">
                  <div className="text-2xl font-bold text-green-400">{publishedCount}</div>
                  <div className="text-sm text-gray-400 mt-1">Published</div>
                </div>
                <div className="bg-[#1a1a2e] p-4 rounded-lg border border-gray-800">
                  <div className="text-2xl font-bold text-gray-400">{archivedCount}</div>
                  <div className="text-sm text-gray-400 mt-1">Archived</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
