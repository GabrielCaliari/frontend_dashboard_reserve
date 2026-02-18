export interface Blog {
  id: number;
  title: string;
  description: string;
  slug: string;
  status: 'active' | 'inactive';
  secret_key?: string;
  created_at: string;
  updated_at: string;
}

export interface BlogCreateInput {
  title: string;
  description: string;
  slug: string;
}

export interface BlogUpdateInput {
  title?: string;
  description?: string;
  slug?: string;
  status?: 'active' | 'inactive';
}

export interface BlogListResponse {
  data: Blog[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface BlogSecretKeyResponse {
  secret_key: string;
  message: string;
}
