export interface AuthorAvatar {
  id: string;
  url: string;
  storage_key: string;
  filename: string;
  mime_type: string;
  file_size: number;
  width?: number | null;
  height?: number | null;
  alt_text?: string | null;
}

export interface Author {
  id: string;
  tenant_id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  biography?: string;
  avatarId?: string;
  avatar_url?: string;
  avatar?: AuthorAvatar;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAuthorDto {
  firstName: string;
  lastName: string;
  biography?: string;
  avatarId?: string;
}

export interface UpdateAuthorDto {
  firstName?: string;
  lastName?: string;
  biography?: string;
  avatarId?: string;
  active?: boolean;
}

export interface AssignAvatarDto {
  avatarId: string;
}

/** Raw snake_case shape returned by the API */
export interface AuthorApiResponse {
  id: string;
  tenant_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  biography: string | null;
  avatar_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  avatar?: AuthorAvatar;
}
