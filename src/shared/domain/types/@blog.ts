export interface Blog {
  id: number;
  name: string;
  description: string;
  slug: string;
  active: boolean;
  secret_key?: string;
  created_at: string;
  updated_at: string;
  tenant_id: number;
}

export interface BlogCreateInput {
  name: string;
  description?: string;
}

export interface BlogUpdateInput {
  name?: string;
  description?: string;
  active?: boolean;
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
