/**
 * Public Blog Listing Page
 * 
 * Displays paginated list of published articles from a blog.
 * Uses blog secret key from environment variable for authentication.
 * 
 * Requirements: 19.1, 19.2
 * Task: 20.1
 */

"use client";

import { useState } from "react";
import { usePublicArticles } from "@/src/common/hooks/cms/usePublicArticles";
import PublicArticleList from "@/src/components/cms/public/public-article-list";

// Blog secret key from environment variable
// This should be configured in .env.local as NEXT_PUBLIC_BLOG_SECRET_KEY
const BLOG_SECRET_KEY = process.env.NEXT_PUBLIC_BLOG_SECRET_KEY || "";

export default function PublicBlogPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  const { data, isLoading, error } = usePublicArticles(
    BLOG_SECRET_KEY,
    currentPage,
    limit
  );

  // Handle page navigation
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
          <p className="text-default-500">
            Blog secret key is not configured. Please add NEXT_PUBLIC_BLOG_SECRET_KEY to your environment variables.
          </p>
        </div>
      </div>
    );
  }

  // Show error state if API request failed
  if (error) {
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Failed to Load Articles
          </h1>
          <p className="text-default-500">
            Unable to fetch articles. Please check your blog secret key configuration or try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Blog
          </h1>
          <p className="text-lg text-default-600 max-w-2xl mx-auto">
            Discover our latest articles, insights, and updates
          </p>
        </header>

        {/* Article List */}
        <PublicArticleList
          articles={data?.data || []}
          isLoading={isLoading}
          pagination={{
            currentPage: data?.meta.current_page || 1,
            totalPages: data?.meta.total_pages || 1,
            onPageChange: handlePageChange,
          }}
        />
      </div>
    </div>
  );
}
