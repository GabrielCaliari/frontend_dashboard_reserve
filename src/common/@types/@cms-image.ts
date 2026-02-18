export interface ArticleImage {
  id: number;
  article_id: number;
  url: string;
  alt_text: string | null;
  display_order: number;
  created_at: string;
}

export interface CreateArticleImageDto {
  article_id: number;
  file: File;
  alt_text?: string;
}

export interface UpdateArticleImageDto {
  alt_text?: string;
  display_order?: number;
}

export interface ReorderImageDto {
  id: number;
  display_order: number;
}
