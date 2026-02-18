"use client";

/**
 * ArticlePreview Component
 *
 * Renders article content with sanitization for preview purposes.
 * Shows how the article will appear when published.
 *
 * Features:
 * - Sanitized HTML rendering
 * - Title and metadata display
 * - Image gallery with Next.js Image optimization
 * - Publication date formatting
 * - Responsive typography
 * - Matches public article styling
 *
 * **Validates: Requirements 18.6**
 */

import { useMemo } from "react";
import Image from "next/image";
import { Card, CardBody, Chip } from "@nextui-org/react";
import { Calendar, Clock, Info } from "lucide-react";
import { sanitizeHtml } from "@/src/common/utils/content-sanitizer";
import type { Article } from "@/src/common/@types/@cms-article";

interface ArticlePreviewProps {
  article: Article;
}

export default function ArticlePreview({ article }: ArticlePreviewProps) {
  // Sanitize HTML content to prevent XSS
  const sanitizedContent = useMemo(
    () => sanitizeHtml(article.content),
    [article.content],
  );

  // Format dates
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not published";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="bg-card border border-border">
        <CardBody className="p-8 space-y-6">
          {/* Preview badge */}
          <div className="flex items-center justify-between">
            <Chip size="sm" variant="flat" color="warning">
              Preview Mode
            </Chip>
            <Chip
              size="sm"
              variant="flat"
              color={
                article.status === "published"
                  ? "success"
                  : article.status === "archived"
                    ? "warning"
                    : "default"
              }
            >
              {article.status}
            </Chip>
          </div>

          {/* Article header */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight text-foreground">
              {article.title}
            </h1>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>
                  {article.published_at
                    ? formatDate(article.published_at)
                    : "Draft"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>Last updated: {formatTime(article.updated_at)}</span>
              </div>
            </div>

            {/* Slug preview */}
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">URL:</span>{" "}
              <code className="text-primary/80 bg-primary/10 px-1.5 py-0.5 rounded text-xs">
                /{article.slug}
              </code>
            </div>
          </div>

          {/* Featured image (first image if available) */}
          {article.images.length > 0 && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
              <Image
                src={article.images[0].url}
                alt={article.images[0].alt_text || article.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                priority
              />
            </div>
          )}

          {/* Article content */}
          <div
            className="prose prose-invert prose-lg max-w-none
              prose-headings:text-foreground
              prose-p:text-foreground/80
              prose-strong:text-foreground
              prose-a:text-primary
              prose-blockquote:border-l-primary/40
              prose-blockquote:text-foreground/70
              prose-code:bg-muted
              prose-code:text-foreground"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />

          {/* Additional images gallery */}
          {article.images.length > 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Gallery</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {article.images.slice(1).map((image) => (
                  <div
                    key={image.id}
                    className="relative aspect-video rounded-lg overflow-hidden bg-muted"
                  >
                    <Image
                      src={image.url}
                      alt={image.alt_text || `Image ${image.display_order + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                    />
                    {image.alt_text && (
                      <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2">
                        <p className="text-sm text-foreground">
                          {image.alt_text}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Article footer */}
          <div className="pt-6 border-t border-border">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Created:</span>{" "}
                {formatDate(article.created_at)}
              </div>
              <div>
                <span className="font-medium">Images:</span>{" "}
                {article.images.length}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Preview notes */}
      <Card className="mt-4 bg-primary/5 border border-primary/20">
        <CardBody className="p-4">
          <div className="flex items-start gap-3">
            <Info size={16} className="text-primary mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Preview Note:</strong> This is
              how your article will appear to readers. The actual published
              version may vary slightly based on your website&apos;s styling.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
