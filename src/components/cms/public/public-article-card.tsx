/**
 * PublicArticleCard Component
 * 
 * Displays an article card with title, excerpt, featured image, and publication date.
 * Used in article listing pages for public consumption.
 * 
 * Requirements: 19.1, 19.6
 */

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Article } from '@/src/common/@types/@cms-article';
import { truncateHtml } from '@/src/common/utils/content-sanitizer';
import { Card, CardBody, CardFooter } from '@nextui-org/react';

export interface PublicArticleCardProps {
  article: Article;
  baseUrl?: string;
}

/**
 * Format date for display
 */
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

/**
 * Get featured image from article images (first image by display_order)
 */
const getFeaturedImage = (article: Article): string | null => {
  if (!article.images || article.images.length === 0) return null;
  
  // Sort by display_order and get first image
  const sortedImages = [...article.images].sort((a, b) => a.display_order - b.display_order);
  return sortedImages[0]?.url || null;
};

/**
 * Main PublicArticleCard component
 */
export const PublicArticleCard: React.FC<PublicArticleCardProps> = ({
  article,
  baseUrl = '/cms/public',
}) => {
  const featuredImage = getFeaturedImage(article);
  const excerpt = truncateHtml(article.content, 150);
  const publicationDate = formatDate(article.published_at);
  const articleUrl = `${baseUrl}/${article.slug}`;

  return (
    <Card
      className="w-full h-full hover:shadow-lg transition-shadow duration-300"
      isPressable
      as={Link}
      href={articleUrl}
    >
      {/* Featured Image */}
      {featuredImage ? (
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={featuredImage}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="relative w-full h-48 bg-default-100 flex items-center justify-center">
          <svg
            className="w-16 h-16 text-default-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}

      <CardBody className="px-4 py-3">
        {/* Article Title */}
        <h3 className="text-xl font-semibold text-default-900 mb-2 line-clamp-2">
          {article.title}
        </h3>

        {/* Article Excerpt */}
        <p className="text-default-600 text-sm line-clamp-3 mb-3">
          {excerpt}
        </p>

        {/* Publication Date */}
        {publicationDate && (
          <div className="flex items-center gap-2 text-xs text-default-400">
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
            <time dateTime={article.published_at || undefined}>
              {publicationDate}
            </time>
          </div>
        )}
      </CardBody>

      <CardFooter className="px-4 py-3 pt-0">
        {/* Read More Link */}
        <div className="flex items-center gap-2 text-primary text-sm font-medium group">
          <span>Read more</span>
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PublicArticleCard;
