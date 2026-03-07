/**
 * Lead Types
 * Based on backend API - /leads endpoints
 */

export enum ELeadStatus {
  new = 1,
  archived = 8,
}

export enum EOriginLead {
  seo_tool = 1,
  seo_archive = 2,
  email = 3,
  facebook_ads = 4,
  google_ads = 5,
  page = 6,
}

// Keep old enums for backward compat with existing pages that use LeadStatus/LeadOrigin
export { ELeadStatus as LeadStatus };
export { EOriginLead as LeadOrigin };

export interface Lead {
  id: string;
  name?: string;
  email?: string;
  phone_number?: string;
  origin: EOriginLead;
  origin_font?: string;
  description?: string;
  status: ELeadStatus;
  data?: Record<string, any>;
  collection_id?: number;
  tenant_id?: number;
  ip_address?: string;
  user_agent?: string;
  country?: string;
  city?: string;
  region?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadAttachment {
  id: number;
  asset_id: number;
  label?: string;
  lead_id: string;
  created_at: string;
}

export interface CreateLeadDto {
  name?: string;
  email?: string;
  phone_number?: string;
  origin?: EOriginLead;
  origin_font?: string;
  description?: string;
  data?: Record<string, any>;
  collection_id?: number;
}

export interface UpdateLeadStatusDto {
  status: ELeadStatus;
}

export interface UpdateLeadDto {
  name?: string;
  email?: string;
  phone_number?: string;
  origin?: EOriginLead;
  origin_font?: string;
  description?: string;
  data?: Record<string, any>;
}

export interface AddAttachmentDto {
  asset_id: number;
  label?: string;
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

export interface LeadCollection {
  id: number;
  name: string;
  slug: string;
  source: string;
  active: boolean;
  tenant_id?: number;
  secret_key?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCollectionDto {
  name: string;
  source: string;
}

export interface UpdateCollectionDto {
  name?: string;
  source?: string;
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
  data: LeadCollection & { secretKey?: string };
}

export interface RegenerateKeyResponse {
  success: boolean;
  data: {
    secretKey: string;
  };
}

// Keep for backward compat
export enum CollectionAccessMode {
  PUBLIC = 'public',
  PRIVATE = 'private',
  RESTRICTED = 'restricted',
}
