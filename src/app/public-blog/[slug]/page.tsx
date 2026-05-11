/**
 * Public Article Detail Page
 *
 * Displays full article content with images and metadata.
 * Uses blog secret key from environment variable for authentication.
 * Implements SEO metadata for better discoverability.
 *
 * Requirements: 19.3, 19.4, 19.5, 19.6
 * Task: 20.2
 */ "use client";

import { usePublicArticleBySlug } from "@/src/shared/hooks/cms/usePublicArticles";
import PublicArticleContent from "@/src/presentation/components/organisms/cms/public/public-article-content";
import { Button } from "@heroui/react";
import Link from "next/link";

// Blog secret key from environment variable
const BLOG_SECRET_KEY = process.env.NEXT_PUBLIC_BLOG_SECRET_KEY || "";

export default function PublicArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const {
    data: article,
    isLoading,
    error,
  } = usePublicArticleBySlug(BLOG_SECRET_KEY, params.slug);

  // Show error state if secret key is not configured
  if (!BLOG_SECRET_KEY) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-danger-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-danger-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Configuration Required
          </h1>
          <p className="text-muted-foreground">
            Blog secret key is not configured. Please add
            NEXT_PUBLIC_BLOG_SECRET_KEY to your environment variables.
          </p>
          <Link href="/public-blog">
            <Button color="primary" variant="flat">
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  // Show 404 error for non-existent or unpublished articles
  if (error || !article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-default-100 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              Article Not Found
            </h1>
            <p className="text-muted-foreground">
              The article you're looking for doesn't exist or is not published
              yet.
            </p>
          </div>
          <Link href="/public-blog">
            <Button color="primary" size="lg">
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Blog Link */}
        <div className="mb-8">
          <Link href="/public-blog">
            <Button
              variant="light"
              color="default"
              startContent={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              }
            >
              Back to Blog
            </Button>
          </Link>
        </div>

        {/* Article Content */}
        <PublicArticleContent article={article} />
      </div>
    </div>
  );
}
