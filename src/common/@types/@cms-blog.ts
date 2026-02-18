export interface Blog {
  id: number;
  tenant_id: number;
  name: string;
  slug: string;
  description: string | null;
  secret_key: string;
  created_at: string;
  updated_at: string;
}

export interface CreateBlogDto {
  name: string;
  description?: string;
}

export interface UpdateBlogDto {
  name?: string;
  description?: string;
}

export interface BlogWithStats extends Blog {
  article_counts: {
    draft: number;
    published: number;
    archived: number;
    total: number;
  };
}
