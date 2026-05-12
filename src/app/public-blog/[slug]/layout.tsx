/**
 * Layout for Public Article Detail Page
 *
 * Generates SEO metadata for article pages including title, description, and og:image.
 * This runs on the server side to enable proper metadata generation.
 *
 * Requirements: 19.3, 19.4, 19.5, 19.6
 * Task: 20.2
 */

import { Metadata } from "next";
import { fetchPublicArticleBySlug } from "@/src/modules/cms/infrastructure/adapters";
import { stripHtml, truncateHtml } from "@/src/shared/utils/content-sanitizer";

const BLOG_SECRET_KEY = process.env.NEXT_PUBLIC_BLOG_SECRET_KEY || "";

/**
 * Generate metadata for article page
 * This function runs on the server and generates SEO-friendly metadata
 */
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  // If no secret key is configured, return default metadata
  if (!BLOG_SECRET_KEY) {
    return {
      title: "Blog Article",
      description: "Read our latest blog article",
    };
  }

  try {
    // Fetch article data for metadata
    const article = await fetchPublicArticleBySlug(
      BLOG_SECRET_KEY,
      params.slug,
    );

    // Generate description from content (max 160 characters for SEO)
    const description = truncateHtml(article.content, 160);

    // Get the first image as og:image if available
    const ogImage =
      article.images.length > 0 ? article.images[0].url : undefined;

    return {
      title: article.title,
      description,
      openGraph: {
        title: article.title,
        description,
        type: "article",
        publishedTime: article.published_at || undefined,
        modifiedTime: article.updated_at,
        images: ogImage
          ? [{ url: ogImage, alt: article.images[0].alt_text || article.title }]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title: article.title,
        description,
        images: ogImage ? [ogImage] : [],
      },
    };
  } catch (error) {
    // If article fetch fails, return default metadata
    return {
      title: "Article Not Found",
      description: "The requested article could not be found",
    };
  }
}

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
