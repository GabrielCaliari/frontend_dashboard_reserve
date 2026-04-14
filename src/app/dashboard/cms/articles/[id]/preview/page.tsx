"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { LayoutScopeRoot } from "@/src/presentation/components/layouts/root-layout";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { ArticleContentRenderer } from "@/src/components/cms/articles/article-content-renderer";
import {
  ArrowLeft,
  Edit,
  Loader2,
  AlertCircle,
  Calendar,
  Clock,
} from "lucide-react";
import Image from "next/image";
import { useGetArticle } from "@/src/common/hooks/cms/use-get-article";
import { useHasSelectedTenant } from "@/src/shared/stores/tenant-store";

export default function ArticlePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const articleId = params.id as string;
  const blogId = searchParams.get("blogId");
  const hasSelectedTenant = useHasSelectedTenant();

  const { data: article, isLoading } = useGetArticle(
    articleId,
    blogId ?? undefined,
  );

  const handleEdit = () => {
    router.push(`/dashboard/cms/articles/${articleId}?blogId=${blogId}`);
  };

  const handleBack = () => {
    router.push(`/dashboard/cms/articles?blogId=${blogId}`);
  };

  // Show tenant selection warning
  if (!hasSelectedTenant) {
    return (
      <LayoutScopeRoot routeActive="articles">
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <Card className="bg-yellow-500/10 border-yellow-500/20 max-w-md">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-yellow-400 mb-2">
                  No Tenant Selected
                </h3>
                <p className="text-muted-foreground">
                  Please select a tenant from the sidebar to preview articles.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  if (!blogId) {
    return (
      <LayoutScopeRoot routeActive="articles">
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <Card className="bg-red-500/10 border-red-500/20 max-w-md">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-red-400 mb-2">
                  Blog Not Selected
                </h3>
                <p className="text-muted-foreground mb-4">
                  Blog ID is missing from the URL.
                </p>
                <Button onClick={() => router.push("/dashboard/cms/articles")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Articles
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  if (isLoading) {
    return (
      <LayoutScopeRoot routeActive="articles">
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      </LayoutScopeRoot>
    );
  }

  if (!article) {
    return (
      <LayoutScopeRoot routeActive="articles">
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-12">
            <Card className="bg-red-500/10 border-red-500/20 max-w-md">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-red-400 mb-2">
                  Article Not Found
                </h3>
                <p className="text-muted-foreground mb-4">
                  The article you're looking for doesn't exist.
                </p>
                <Button
                  onClick={() =>
                    router.push(`/dashboard/cms/articles?blogId=${blogId}`)
                  }
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Articles
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </LayoutScopeRoot>
    );
  }

  const coverImage = article.coverImage ?? article.images[0] ?? null;

  return (
    <LayoutScopeRoot routeActive="articles">
      <div className="min-h-screen bg-background">
        {/* Preview Header */}
        <header className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={handleBack}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Article Preview
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    This is how your article will appear to readers
                  </p>
                </div>
              </div>
              <Button onClick={handleEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Article
              </Button>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <main className="container mx-auto px-6 py-12 max-w-4xl">
          <article className="space-y-8">
            {/* Article Header */}
            <header className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    article.status === "published"
                      ? "bg-green-500/10 text-green-400"
                      : article.status === "draft"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-default-100 text-muted-foreground"
                  }`}
                >
                  {article.status.charAt(0).toUpperCase() +
                    article.status.slice(1)}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-default-100 text-muted-foreground uppercase">
                  {article.language ?? "en_us"}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                {article.title}
              </h1>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {article.published_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <time dateTime={article.published_at}>
                      {new Date(article.published_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </time>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Last updated{""}
                    {new Date(article.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>

              {/* Slug */}
              <div className="text-sm text-muted-foreground font-mono">
                URL: /{article.slug}
              </div>
            </header>

            {/* Divider */}
            <hr className="border-border" />

            {coverImage && (
              <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-default-100">
                <Image
                  src={coverImage.url}
                  alt={coverImage.alt_text || article.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1200px) 100vw, 1024px"
                  priority
                />
              </div>
            )}

            {/* Article Body */}
            <ArticleContentRenderer
              content={article.content}
              className="prose prose-invert prose-lg max-w-none
 prose-headings:text-foreground prose-headings:font-bold
 prose-p:text-muted-foreground prose-p:leading-relaxed
 prose-a:text-primary prose-a:no-underline hover:prose-a:underline
 prose-strong:text-foreground prose-strong:font-semibold
 prose-code:text-primary prose-code:bg-default-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
 prose-pre:bg-default-100 prose-pre:border prose-pre:border-border
 prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
 prose-ul:text-muted-foreground prose-ol:text-muted-foreground
 prose-li:text-muted-foreground
 prose-img:rounded-lg prose-img:"
            />

            {/* Empty State */}
            {!article.content && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No content yet. Start writing to see your article here.
                </p>
              </div>
            )}
          </article>
        </main>
      </div>
    </LayoutScopeRoot>
  );
}
