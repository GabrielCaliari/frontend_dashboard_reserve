/**
 * CMS Media Storage Type Definitions
 * 
 * Type definitions for media collections, assets, and relations
 * used in the CMS media storage feature.
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * Collection type defining the category of media assets
 */
export type CollectionType = 'images' | 'documents' | 'videos' | 'mixed';

/**
 * Asset status indicating the current state of a media asset
 */
export type AssetStatus = 'active' | 'archived' | 'failed';

// ============================================================================
// Core Entities
// ============================================================================

/**
 * Media Collection
 * 
 * Represents a collection of media assets with specific rules and constraints.
 * Collections organize assets by context and enforce validation rules.
 */
export interface MediaCollection {
  id: number;
  name: string;
  slug: string;
  description?: string;
  type: CollectionType;
  allowed_mime_types: string[];
  max_file_size: number; // bytes
  max_items?: number;
  tenant_id: number;
  created_at: string;
  updated_at: string;
}

/**
 * Media Asset
 * 
 * Represents a single media file stored in Vercel Blob Storage.
 * Contains metadata, dimensions, and storage information.
 */
export interface MediaAsset {
  id: number;
  url: string;
  storage_key: string;
  filename: string;
  mime_type: string;
  file_size: number; // bytes
  width?: number;
  height?: number;
  alt_text?: string;
  metadata?: Record<string, any>;
  status: AssetStatus;
  collection_id: number;
  tenant_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

/**
 * Media Relation
 * 
 * Represents the relationship between a media asset and an entity.
 * Supports polymorphic relations (articles, blogs, etc.) with display ordering.
 */
export interface MediaRelation {
  id: number;
  asset_id: number;
  entity_type: string; // e.g., 'article', 'blog'
  entity_id: number;
  display_order: number;
  metadata?: Record<string, any>;
  tenant_id: number;
  created_at: string;
  asset?: MediaAsset; // populated in responses
}

// ============================================================================
// API Request DTOs
// ============================================================================

/**
 * Create Collection Request
 */
export interface CreateCollectionRequest {
  name: string;
  slug: string;
  description?: string;
  type: CollectionType;
  allowed_mime_types: string[];
  max_file_size: number;
  max_items?: number;
}

/**
 * Update Collection Request
 */
export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  allowed_mime_types?: string[];
  max_file_size?: number;
  max_items?: number;
}

/**
 * Upload Asset Request
 */
export interface UploadAssetRequest {
  file: File;
  collection_id: number;
  alt_text?: string;
  metadata?: Record<string, any>;
}

/**
 * Update Asset Request
 */
export interface UpdateAssetRequest {
  alt_text?: string;
  metadata?: Record<string, any>;
  status?: AssetStatus;
}

/**
 * Create Relation Request
 */
export interface CreateRelationRequest {
  asset_id: number;
  entity_type: string;
  entity_id: number;
  display_order?: number;
  metadata?: Record<string, any>;
}

/**
 * Reorder Relations Request
 */
export interface ReorderRelationsRequest {
  relations: Array<{
    id: number;
    display_order: number;
  }>;
}

// ============================================================================
// API Query Parameters
// ============================================================================

/**
 * Pagination Parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Collection List Query Parameters
 */
export interface CollectionListParams extends PaginationParams {
  type?: CollectionType;
  search?: string;
}

/**
 * Asset List Query Parameters
 */
export interface AssetListParams extends PaginationParams {
  collection_id?: number;
  status?: AssetStatus;
  search?: string;
  mime_type?: string;
}

/**
 * Relation List Query Parameters
 */
export interface RelationListParams extends PaginationParams {
  entity_type?: string;
  entity_id?: number;
  asset_id?: number;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Paginated Response Metadata
 */
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Paginated Response Wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Collection List Response
 */
export type CollectionListResponse = PaginatedResponse<MediaCollection>;

/**
 * Asset List Response
 */
export type AssetListResponse = PaginatedResponse<MediaAsset>;

/**
 * Relation List Response
 */
export type RelationListResponse = PaginatedResponse<MediaRelation>;

/**
 * Single Collection Response
 */
export interface CollectionResponse {
  data: MediaCollection;
}

/**
 * Single Asset Response
 */
export interface AssetResponse {
  data: MediaAsset;
}

/**
 * Single Relation Response
 */
export interface RelationResponse {
  data: MediaRelation;
}

/**
 * API Error Response
 */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  status: number;
}

/**
 * Upload Progress Event
 */
export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

// ============================================================================
// UI Component Props Types
// ============================================================================

/**
 * Media Picker Configuration
 */
export interface MediaPickerConfig {
  multiple?: boolean;
  collectionId?: number;
  allowedTypes?: CollectionType[];
  maxSelections?: number;
}

/**
 * Media Picker Selection Result
 */
export interface MediaPickerResult {
  assets: MediaAsset[];
  cancelled: boolean;
}

/**
 * Asset Grid Item
 */
export interface AssetGridItem extends MediaAsset {
  selected?: boolean;
  loading?: boolean;
}

/**
 * Upload Queue Item
 */
export interface UploadQueueItem {
  id: string;
  file: File;
  collectionId: number;
  altText?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  result?: MediaAsset;
}
