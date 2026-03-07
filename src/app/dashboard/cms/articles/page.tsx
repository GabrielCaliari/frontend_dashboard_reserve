"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { AlertCircle, FileText } from "lucide-react";
import { Card, CardBody } from "@heroui/react";
import { BlogSelector } from "@/src/components/cms/blog-selector";
import { ArticleList } from "@/src/components/cms/articles";
import { useListArticles } from "@/src/common/hooks/cms/use-list-articles";
import { useDeleteArticle } from "@/src/common/hooks/cms/use-delete-article";
import {
  usePublishArticle,
  useArchiveArticle,
  useReorderArticles,
} from "@/src/common/hooks/cms/useArticleMutations";
import {
  useHasSelectedTenant,
  useTenantStore,
} from "@/src/common/stores/tenant-store";
import type {
  Article,
  ReorderArticleDto,
} from "@/src/common/@types/@cms-article";
import { toast } from "sonner";

type ArticleStatus = "draft" | "published" | "archived";

function ArticlesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedBlogId, setSelectedBlogId] = useState<string>(
    searchParams.get("blogId") || "",
  );
  const [currentStatus, setCurrentStatus] = useState<ArticleStatus | undefined>(
    undefined,
  );

  const hasSelectedTenant = useHasSelectedTenant();
  const selectedTenant = useTenantStore((state) => state.selectedTenant);

  const blogIdNum = selectedBlogId ? parseInt(selectedBlogId) : 0;

  const { data: articlesData, isLoading, error, isError } = useListArticles(blogIdNum, 1, 50);
  
  const { mutate: deleteArticle } = useDeleteArticle(blogIdNum);
  const { mutate: publishArticle } = usePublishArticle();
  const { mutate: archiveArticle } = useArchiveArticle();
  const { mutate: reorderArticles } = useReorderArticles();

  // fetchArticles returns Article[] directly, normalize for ArticleList
  const articles: Article[] = Array.isArray(articlesData)
    ? articlesData
    : ((articlesData as any)?.data ?? []);

  // Show error state
  if (isError && selectedBlogId) {
    return (
      <LayoutScopeRoot routeActive="articles">
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-16">
            <Card className="max-w-md border-danger/20 bg-danger/5">
              <CardBody className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-danger" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Error Loading Articles
                </h3>
                <p className="text-muted-foreground">
                  {error instanceof Error ? error.message : 'Failed to load articles. Please try again.'}
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  const handleDelete = (article: Article) => {
    if (confirm(`Are you sure you want to delete "${article.title}"?`)) {
      deleteArticle(article.id);
    }
  };

  const handlePublish = (article: Article) => {
    if (article.status !== "draft") {
      toast.warning("Only draft articles can be published");
      return;
    }
    if (confirm(`Publish "${article.title}"?`)) {
      publishArticle({ blogId: blogIdNum, articleId: article.id });
    }
  };

  const handleArchive = (article: Article) => {
    if (article.status !== "published") {
      toast.warning("Only published articles can be archived");
      return;
    }
    if (confirm(`Archive "${article.title}"?`)) {
      archiveArticle({ blogId: blogIdNum, articleId: article.id });
    }
  };

  const handleReorder = (reorderedArticles: ReorderArticleDto[]) => {
    reorderArticles({ blogId: blogIdNum, order: reorderedArticles });
  };

  // Show tenant selection warning
  if (!hasSelectedTenant) {
    return (
      <LayoutScopeRoot routeActive="articles">
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
                  Please select a tenant from the sidebar to manage articles.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  return (
    <LayoutScopeRoot routeActive="articles">
      <div className="p-8 space-y-6 max-w-7xl mx-auto">
        {/* Blog Selector Card */}
        <Card className="border-none shadow-sm">
          <CardBody className="p-6">
            <div className="flex items-center gap-6">
              <div className="flex-1 max-w-md">
                <BlogSelector
                  value={selectedBlogId}
                  onValueChange={setSelectedBlogId}
                  placeholder="Select a blog to manage articles"
                />
              </div>
              {selectedTenant && (
                <div className="text-sm text-muted-foreground">
                  Managing content for{" "}
                  <span className="font-semibold text-primary">
                    {selectedTenant.name}
                  </span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {!selectedBlogId ? (
          <Card className="border-none shadow-sm">
            <CardBody className="p-16">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Select a blog
                </h3>
                <p className="text-muted-foreground">
                  Choose a blog from the dropdown above to view and manage its
                  articles
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <ArticleList
            blogId={blogIdNum}
            articles={articles}
            isLoading={isLoading}
            currentStatus={currentStatus}
            onStatusChange={setCurrentStatus}
            onCreateClick={() =>
              router.push(
                `/dashboard/cms/articles/new?blogId=${selectedBlogId}`,
              )
            }
            onEditClick={(article) =>
              router.push(
                `/dashboard/cms/articles/${article.id}?blogId=${selectedBlogId}`,
              )
            }
            onDeleteClick={handleDelete}
            onPublishClick={handlePublish}
            onArchiveClick={handleArchive}
            onPreviewClick={(article) =>
              router.push(
                `/dashboard/cms/articles/${article.id}/preview?blogId=${selectedBlogId}`,
              )
            }
            onReorder={handleReorder}
          />
        )}
      </div>
    </LayoutScopeRoot>
  );
}

export default function ArticlesPage() {
  return (
    <Suspense
      fallback={
        <LayoutScopeRoot routeActive="articles">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading articles...</span>
          </div>
        </LayoutScopeRoot>
      }
    >
      <ArticlesPageContent />
    </Suspense>
  );
}
