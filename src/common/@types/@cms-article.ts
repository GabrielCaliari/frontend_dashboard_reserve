import { ArticleImage } from './@cms-image';

export type ArticleStatus = 'draft' | 'published' | 'archived';

export type ArticleLanguage = string;

export interface ArticleCoverImage {
  id: string;
  url: string;
  alt_text: string | null;
}

export interface Article {
  id: string | number;
  blog_id: string | number;
  title: string;
  displayTitle: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  authorId?: string;
  coverImageId?: string;
  coverImage?: ArticleCoverImage | null;
  language?: ArticleLanguage;
  status: ArticleStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  images: ArticleImage[];
}

export interface CreateArticleDto {
  displayTitle: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  slug: string;
  authorId: string;
  blogId?: string;
  content: string;
  coverImageId?: string;
  language: ArticleLanguage;
}

export interface UpdateArticleDto {
  displayTitle?: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  slug?: string;
  authorId?: string;
  blogId?: string;
  content?: string;
  coverImageId?: string;
  language?: ArticleLanguage;
  status?: ArticleStatus;
}

export interface ArticleListItem extends Omit<Article, 'content' | 'images'> {
  image_count: number;
}
