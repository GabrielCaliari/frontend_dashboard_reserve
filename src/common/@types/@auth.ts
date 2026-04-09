// Auth Types - Nova arquitetura DDD

export interface LoginCredentials {
  email: string;
  password: string;
}

export enum AdminRole {
  super_admin = "super_admin",
  owner = "owner",
  manager = "manager",
  editor = "editor",
  viewer = "viewer",
}

export interface AuthResponse {
  session_id: string;
  session_token: string;
  details: {
    name: string;
    email: string;
    role: AdminRole;
  };
}

export interface AdminProfile {
  name: string;
  email: string;
  role: AdminRole;
  active: boolean;
  tenants: Tenant[];
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string;
  active?: boolean;
}

export interface ApiError {
  code: string;
  message?: string;
}
