import { ArticleImage } from './@cms-image';

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface Article {
  id: string;
  blog_id: string;
  title: string;
  displayTitle: string;
  slug: string;
  content: string;
  metaTitle?: string;
  metaDescription?: string;
  focusKeyword?: string;
  authorId?: string;
  coverImageId?: string;
  status: ArticleStatus;
  display_order: number;
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
}

export interface ReorderArticleDto {
  id: string;
  display_order: number;
}

export interface ArticleListItem extends Omit<Article, 'content' | 'images'> {
  image_count: number;
}
