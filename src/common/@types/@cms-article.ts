import { ArticleImage } from './@cms-image';

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface Article {
  id: number;
  blog_id: number;
  title: string;
  slug: string;
  content: string;
  status: ArticleStatus;
  display_order: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  images: ArticleImage[];
}

export interface CreateArticleDto {
  displayTitle: string;
  metaTitle: string;
  slug: string;
  authorId: string;
  blogId?: string;
  content: string;
}

export interface UpdateArticleDto {
  displayTitle?: string;
  metaTitle?: string;
  slug?: string;
  authorId?: string;
  blogId?: string;
  content?: string;
}

export interface ReorderArticleDto {
  id: number;
  display_order: number;
}

export interface ArticleListItem extends Omit<Article, 'content' | 'images'> {
  image_count: number;
}
