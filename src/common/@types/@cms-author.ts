export interface Author {
  id: string;
  tenant_id: string;
  firstName: string;
  lastName: string;
  biography?: string;
  avatarId?: string;
  avatar_url?: string;
  active?: boolean;
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
}

export interface AssignAvatarDto {
  avatarId: string;
}
