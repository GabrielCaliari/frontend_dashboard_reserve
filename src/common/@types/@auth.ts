// Auth Types - Nova arquitetura DDD

export interface LoginCredentials {
  email: string;
  password: string;
}

export enum AdminRole {
  super_admin = 'super_admin',
  company_admin = 'company_admin',
  tenant_admin = 'tenant_admin',
}

export interface AuthResponse {
  session_id: number;
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
  id: number;
  name: string;
  slug: string;
  domain: string;
  active?: boolean;
}

export interface ApiError {
  code: string;
  message?: string;
}
