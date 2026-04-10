/**
 * PublicArticleContent Component
 *
 * Renders the full article content with sanitized HTML, images, and metadata.
 * Used on article detail pages for public consumption.
 *
 * Requirements: 19.4, 19.5, 19.6
 */

import React from "react";
import Image from "next/image";
import { Article } from "@/src/shared/domain/types/@cms-article";
import { ArticleContentRenderer } from "@/src/components/cms/articles/article-content-renderer";

export interface PublicArticleContentProps {
  article: Article;
}

/**
 * Format date for display
 */
const formatDate = (dateString: string | null): string => {
  if (!dateString) return "";

  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
};

/**
 * Format date with time for display
 */
const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

/**
 * Article metadata section
 */
const ArticleMetadata: React.FC<{
  publishedAt: string | null;
  updatedAt: string;
}> = ({ publishedAt, updatedAt }) => {
  const publicationDate = formatDate(publishedAt);
  const lastUpdated = formatDateTime(updatedAt);
  const showUpdated =
    publishedAt && new Date(updatedAt) > new Date(publishedAt);

  return (
    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-8 pb-6 border-b border-border">
      {publicationDate && (
        <div className="flex items-center gap-2">
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
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <time dateTime={publishedAt || undefined}>
            Published {publicationDate}
          </time>
        </div>
      )}

      {showUpdated && (
        <div className="flex items-center gap-2">
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <time dateTime={updatedAt}>Updated {lastUpdated}</time>
        </div>
      )}
    </div>
  );
};

/**
 * Article image gallery
 */
const ArticleImageGallery: React.FC<{
  images: Article["images"];
  articleTitle: string;
  coverImageId?: string;
}> = ({ images, articleTitle, coverImageId }) => {
  if (!images || images.length === 0) return null;

  // Sort images by display_order
  const sortedImages = [...images]
    .filter((image) => String(image.id) !== String(coverImageId ?? ""))
    .sort((a, b) => a.display_order - b.display_order);

  if (sortedImages.length === 0) return null;

  return (
    <div className="my-8 space-y-6">
      {sortedImages.map((image, index) => (
        <figure key={image.id} className="w-full">
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-default-100">
            <Image
              src={image.url}
              alt={image.alt_text || `${articleTitle} - Image ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              priority={index === 0}
            />
          </div>
          {image.alt_text && (
            <figcaption className="mt-2 text-sm text-center text-muted-foreground italic">
              {image.alt_text}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
};

/**
 * Main PublicArticleContent component
 */
export const PublicArticleContent: React.FC<PublicArticleContentProps> = ({
  article,
}) => {
  const coverImage = article.coverImage ?? article.images[0] ?? null;

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      {/* Article Header */}
      <header className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
          {article.title}
        </h1>

        <ArticleMetadata
          publishedAt={article.published_at}
          updatedAt={article.updated_at}
        />

        {coverImage && (
          <div className="relative mt-8 aspect-video overflow-hidden rounded-2xl bg-default-100">
            <Image
              src={coverImage.url}
              alt={coverImage.alt_text || article.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
              priority
            />
          </div>
        )}
      </header>

      {/* Article Content */}
      <ArticleContentRenderer
        content={article.content}
        className="prose prose-lg dark:prose-invert max-w-none
 prose-headings:text-foreground prose-headings:font-semibold
 prose-p:text-foreground prose-p:leading-relaxed
 prose-a:text-primary prose-a:no-underline hover:prose-a:underline
 prose-strong:text-foreground prose-strong:font-semibold
 prose-code:text-primary prose-code:bg-default-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
 prose-pre:bg-default-100 prose-pre:text-foreground
 prose-blockquote:border-l-border prose-blockquote:text-muted-foreground
 prose-ul:text-foreground prose-ol:text-foreground
 prose-li:text-foreground
 prose-table:text-foreground
 prose-img:rounded-lg"
      />

      {/* Article Images Gallery */}
      <ArticleImageGallery
        images={article.images}
        articleTitle={article.title}
        coverImageId={coverImage?.id}
      />

      {/* Back to Articles Link */}
      <div className="mt-12 pt-8 border-t border-border">
        <a
          href="./"
          className="inline-flex items-center gap-2 text-primary hover:underline"
        >
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
          <span>Back to articles</span>
        </a>
      </div>
    </article>
  );
};

export default PublicArticleContent;
