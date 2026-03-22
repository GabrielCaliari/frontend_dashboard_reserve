"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LayoutScopeRoot } from "@/src/layout/root-layout";
import { AlertCircle } from "lucide-react";
import { Card, CardBody } from "@heroui/react";
import { BlogSelector } from "@/src/components/cms/blog-selector";
import { ArticleList } from "@/src/components/cms/articles";
import { ArticleQuickEditDrawer } from "@/src/components/cms/articles/article-quick-edit-drawer";
import { useListArticles } from "@/src/common/hooks/cms/use-list-articles";
import { useDeleteArticle } from "@/src/common/hooks/cms/use-delete-article";
import {
  usePublishArticle,
  useArchiveArticle,
  useUnarchiveArticle,
  useUpdateArticle,
} from "@/src/common/hooks/cms/useArticleMutations";
import { useGetAuthors } from "@/src/common/hooks/cms/use-get-authors";
import {
  useHasSelectedTenant,
  useTenantStore,
} from "@/src/common/stores/tenant-store";
import type { Article } from "@/src/common/@types/@cms-article";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/src/components/access-management/shared/confirmation-dialog";

type ArticleStatus = "draft" | "published" | "archived";

function ArticlesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedBlogId, setSelectedBlogId] = useState<string>(
    searchParams.get("blogId") || "",
  );
  const [currentStatus, setCurrentStatus] = useState<ArticleStatus | undefined>(undefined);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);

  const handleBlogChange = useCallback((value: string) => {
    setSelectedBlogId(value);
  }, []);

  const hasSelectedTenant = useHasSelectedTenant();
  const selectedTenant = useTenantStore((state) => state.selectedTenant);

  const { data: articlesData, isLoading, error, isError } = useListArticles(selectedBlogId || undefined, 1, 50);
  const { data: authorsData } = useGetAuthors();

  const { mutate: deleteArticle } = useDeleteArticle();
  const { mutate: publishArticle, isPending: isPublishingArticle } = usePublishArticle();
  const { mutate: archiveArticle, isPending: isArchivingArticle } = useArchiveArticle();
  const { mutate: unarchiveArticle, isPending: isUnarchivingArticle } = useUnarchiveArticle();
  const { mutate: updateArticle, isPending: isUpdatingArticle } = useUpdateArticle();

  const articles: Article[] = Array.isArray(articlesData)
    ? articlesData
    : ((articlesData as any)?.data ?? []);
  
  const authors = Array.isArray(authorsData) ? authorsData : [];
  
  // Debug temporário
  console.log('Authors loaded:', authors.length, authors.slice(0, 2));

  if (isError) {
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
                  {error instanceof Error ? error.message : "Failed to load articles. Please try again."}
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  const handleDelete = (article: Article) => {
    setDeleteTarget(article);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    deleteArticle(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
      onError: () => setDeleteTarget(null),
    });
  };

  const handlePublish = (article: Article) => {
    if (article.status !== "draft") {
      toast.warning("Only draft articles can be published");
      return;
    }
    publishArticle({ blogId: article.blog_id, articleId: article.id });
    setSelectedArticle(null);
  };

  const handleArchive = (article: Article) => {
    if (article.status !== "published") {
      toast.warning("Only published articles can be archived");
      return;
    }
    archiveArticle({ blogId: article.blog_id, articleId: article.id });
    setSelectedArticle(null);
  };

  const handleUnarchive = (article: Article) => {
    if (article.status !== "archived") {
      toast.warning("Only archived articles can be restored");
      return;
    }
    unarchiveArticle({ blogId: article.blog_id, articleId: article.id });
    setSelectedArticle(null);
  };

  const handleQuickUpdate = (articleId: number, blogId: number, data: any) => {
    updateArticle(
      { blogId, articleId, data },
      {
        onSuccess: () => {
          setSelectedArticle(null);
        },
      }
    );
  };

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
      <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Blog Selector Card */}
        <Card className="border-none shadow-sm">
          <CardBody className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <div className="flex-1 sm:max-w-md">
                <BlogSelector
                  value={selectedBlogId}
                  onValueChange={handleBlogChange}
                  autoSelect={false}
                  placeholder="All blogs"
                />
              </div>
              {selectedTenant && (
                <div className="text-sm text-muted-foreground">
                  Managing content for{" "}
                  <span className="font-semibold text-primary">{selectedTenant.name}</span>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        <ArticleList
          articles={articles}
          authors={authors}
          isLoading={isLoading}
          currentStatus={currentStatus}
          onStatusChange={setCurrentStatus}
          onCreateClick={() =>
            router.push(
              `/dashboard/cms/articles/new${selectedBlogId ? `?blogId=${selectedBlogId}` : ""}`,
            )
          }
          onRowClick={setSelectedArticle}
        />

        <ConfirmationDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Article"
          message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
          confirmText="Delete"
          variant="danger"
        />

        <ArticleQuickEditDrawer
          article={selectedArticle}
          authors={authors}
          isOpen={selectedArticle !== null}
          onClose={() => setSelectedArticle(null)}
          onEditClick={(article) =>
            router.push(`/dashboard/cms/articles/${article.id}?blogId=${article.blog_id}`)
          }
          onPreviewClick={(article) =>
            router.push(`/dashboard/cms/articles/${article.id}/preview?blogId=${article.blog_id}`)
          }
          onPublish={handlePublish}
          onArchive={handleArchive}
          onUnarchive={handleUnarchive}
          onDelete={handleDelete}
          onSave={handleQuickUpdate}
          isStatusActionPending={isPublishingArticle || isArchivingArticle || isUnarchivingArticle}
          isSaving={isUpdatingArticle}
        />
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
