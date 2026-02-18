export interface ArticleImage {
  id: number;
  url: string;
  alt_text: string;
  display_order: number;
}

export interface Article {
  id: number;
  blog_id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status: 'draft' | 'published' | 'archived';
  published_at?: string;
  display_order: number;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
  images: ArticleImage[];
}

export interface ArticleCreateInput {
  blog_id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  status?: 'draft' | 'published' | 'archived';
  display_order?: number;
  meta_title?: string;
  meta_description?: string;
}

export interface ArticleUpdateInput {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  status?: 'draft' | 'published' | 'archived';
  display_order?: number;
  meta_title?: string;
  meta_description?: string;
}

export interface ArticleListResponse {
  data: Article[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface PublicArticleListParams {
  page?: number;
  limit?: number;
}

export interface PublicArticle {
  id: number;
  title: string;
  slug: string;
  content: string;
  published_at: string;
  display_order: number;
  images: ArticleImage[];
}

export interface PublicArticleListResponse {
  data: PublicArticle[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
