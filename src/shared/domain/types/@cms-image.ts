export interface ArticleImage {
  id: string;
  article_id: string;
  url: string;
  alt_text: string | null;
  display_order: number;
  created_at: string;
}

export interface CreateArticleImageDto {
  article_id: string;
  file: File;
  alt_text?: string;
}

export interface UpdateArticleImageDto {
  alt_text?: string;
  display_order?: number;
}

export interface ReorderImageDto {
  id: string;
  display_order: number;
}
