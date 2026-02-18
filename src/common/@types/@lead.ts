/**
 * Lead Types
 * Based on API v2 - /leads endpoints
 */

export enum LeadOrigin {
  UNKNOWN = 1,
  WEBSITE = 2,
  SOCIAL_MEDIA = 3,
  EMAIL_CAMPAIGN = 4,
  REFERRAL = 5,
  LANDING_PAGE = 6,
}

export enum LeadStatus {
  NEW = 1,
  CONTACTED = 2,
  QUALIFIED = 3,
  CONVERTED = 4,
  ARCHIVED = 5,
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  origin: LeadOrigin;
  origin_font?: string;
  description?: string;
  status: LeadStatus;
  data?: Record<string, any>;
  collection_id?: number;
  tenant_id: number;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadDto {
  name?: string;
  email?: string;
  phone_number?: string;
  origin?: LeadOrigin;
  origin_font?: string;
  description?: string;
  data: Record<string, any>;
}

export interface UpdateLeadStatusDto {
  status: LeadStatus;
}

export interface LeadListResponse {
  success: boolean;
  data: {
    leads: Lead[];
    page: {
      count: number;
      count_pages: number;
      current_page: number;
      limit: number;
    };
  };
}

export interface LeadDetailResponse {
  success: boolean;
  data: Lead;
}

/**
 * Lead Collection Types
 */

export enum CollectionAccessMode {
  PUBLIC = 'public',
  PRIVATE = 'private',
  RESTRICTED = 'restricted',
}

export interface LeadCollection {
  id: number;
  name: string;
  slug: string;
  source: string;
  access_mode: CollectionAccessMode;
  allowed_domains: string[];
  active: boolean;
  tenant_id: number;
  secret_key?: string;
  lead_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCollectionDto {
  name: string;
  source: string;
  access_mode: CollectionAccessMode;
  allowed_domains?: string[];
}

export interface UpdateCollectionDto {
  name?: string;
  source?: string;
  access_mode?: CollectionAccessMode;
  allowed_domains?: string[];
  active?: boolean;
}

export interface CollectionListResponse {
  success: boolean;
  data: {
    collections: LeadCollection[];
    meta: {
      total: number;
      page: number;
      limit: number;
    };
  };
}

export interface CollectionDetailResponse {
  success: boolean;
  data: LeadCollection;
}

export interface RegenerateKeyResponse {
  success: boolean;
  data: {
    secretKey: string;
  };
}
