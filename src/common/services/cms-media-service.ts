import cmsApiClient from '@/src/common/config/cms-api-client';
import { withRetry, transformCMSError } from '@/src/common/utils/cms-error-handler';

/**
 * CMS Media Storage Service
 * Handles collections, assets, and relations for the CMS media storage system
 */

// ============================================================================
// Types
// ============================================================================

export interface MediaCollection {
  id: number;
  name: string;
  slug: string;
  description?: string;
  type: 'images' | 'documents' | 'videos' | 'mixed';
  allowed_mime_types: string[];
  max_file_size: number; // bytes
  max_items?: number;
  tenant_id: number;
  created_at: string;
  updated_at: string;
}

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
  status: 'active' | 'archived' | 'failed';
  collection_id: number;
  tenant_id: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface MediaRelation {
  id: number;
  asset_id: number;
  entity_type: string;
  entity_id: number;
  display_order: number;
  metadata?: Record<string, any>;
  tenant_id: number;
  created_at: string;
  asset?: MediaAsset;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateCollectionDto {
  name: string;
  slug: string;
  description?: string;
  type: 'images' | 'documents' | 'videos' | 'mixed';
  allowed_mime_types: string[];
  max_file_size: number;
  max_items?: number;
}

export interface UpdateCollectionDto {
  name?: string;
  description?: string;
  type?: 'images' | 'documents' | 'videos' | 'mixed';
  allowed_mime_types?: string[];
  max_file_size?: number;
  max_items?: number;
}

export interface UploadAssetDto {
  file: File;
  collection_id: number;
  alt_text?: string;
  metadata?: Record<string, any>;
}

export interface UpdateAssetDto {
  alt_text?: string;
  metadata?: Record<string, any>;
  status?: 'active' | 'archived' | 'failed';
}

export interface CreateRelationDto {
  asset_id: number;
  entity_type: string;
  entity_id: number;
  display_order?: number;
  metadata?: Record<string, any>;
}

export interface ReorderRelationDto {
  id: number;
  display_order: number;
}

export interface AssetFilters {
  collection_id?: number;
  status?: 'active' | 'archived' | 'failed';
  search?: string;
}

export interface RelationFilters {
  entity_type?: string;
  entity_id?: number;
  asset_id?: number;
}

// ============================================================================
// Collection Methods
// ============================================================================

/**
 * Fetch all collections with optional pagination
 * @param params - Pagination parameters
 * @returns Promise<PaginatedResponse<MediaCollection>>
 */
export const fetchCollections = async (
  params?: PaginationParams
): Promise<PaginatedResponse<MediaCollection>> => {
  try {
    return await withRetry(async () => {
      const response = await cmsApiClient.get('collections', { params });
      return response.data;
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Fetch a single collection by ID
 * @param id - Collection ID
 * @returns Promise<MediaCollection>
 */
export const fetchCollectionById = async (id: number): Promise<MediaCollection> => {
  try {
    return await withRetry(async () => {
      const response = await cmsApiClient.get(`collections/${id}`);
      return response.data;
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Create a new collection
 * @param data - Collection creation data
 * @returns Promise<MediaCollection>
 */
export const createCollection = async (
  data: CreateCollectionDto
): Promise<MediaCollection> => {
  try {
    const response = await cmsApiClient.post('collections', data);
    return response.data;
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Update an existing collection
 * @param id - Collection ID
 * @param data - Collection update data
 * @returns Promise<MediaCollection>
 */
export const updateCollection = async (
  id: number,
  data: UpdateCollectionDto
): Promise<MediaCollection> => {
  try {
    const response = await cmsApiClient.patch(`collections/${id}`, data);
    return response.data;
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Delete a collection
 * @param id - Collection ID
 * @returns Promise<void>
 */
export const deleteCollection = async (id: number): Promise<void> => {
  try {
    await cmsApiClient.delete(`collections/${id}`);
  } catch (error) {
    throw transformCMSError(error);
  }
};

// ============================================================================
// Asset Methods
// ============================================================================

/**
 * Fetch assets with optional filters and pagination
 * @param filters - Asset filters (collection_id, status, search)
 * @param params - Pagination parameters
 * @returns Promise<PaginatedResponse<MediaAsset>>
 */
export const fetchAssets = async (
  filters?: AssetFilters,
  params?: PaginationParams
): Promise<PaginatedResponse<MediaAsset>> => {
  try {
    return await withRetry(async () => {
      const queryParams = { ...filters, ...params };
      const response = await cmsApiClient.get('assets', { params: queryParams });
      return response.data;
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Fetch a single asset by ID
 * @param id - Asset ID
 * @returns Promise<MediaAsset>
 */
export const fetchAssetById = async (id: number): Promise<MediaAsset> => {
  try {
    return await withRetry(async () => {
      const response = await cmsApiClient.get(`assets/${id}`);
      return response.data;
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Upload a new asset to a collection
 * @param data - Upload data including file and metadata
 * @param onProgress - Optional progress callback
 * @returns Promise<MediaAsset>
 */
export const uploadAsset = async (
  data: UploadAssetDto,
  onProgress?: (progress: number) => void
): Promise<MediaAsset> => {
  try {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('collection_id', data.collection_id.toString());
    
    if (data.alt_text) {
      formData.append('alt_text', data.alt_text);
    }
    
    if (data.metadata) {
      formData.append('metadata', JSON.stringify(data.metadata));
    }

    const response = await cmsApiClient.post('assets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Update asset metadata
 * @param id - Asset ID
 * @param data - Asset update data
 * @returns Promise<MediaAsset>
 */
export const updateAsset = async (
  id: number,
  data: UpdateAssetDto
): Promise<MediaAsset> => {
  try {
    const response = await cmsApiClient.patch(`assets/${id}`, data);
    return response.data;
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Delete an asset
 * @param id - Asset ID
 * @returns Promise<void>
 */
export const deleteAsset = async (id: number): Promise<void> => {
  try {
    await cmsApiClient.delete(`assets/${id}`);
  } catch (error) {
    throw transformCMSError(error);
  }
};

// ============================================================================
// Relation Methods
// ============================================================================

/**
 * Fetch relations with optional filters
 * @param filters - Relation filters (entity_type, entity_id, asset_id)
 * @returns Promise<MediaRelation[]>
 */
export const fetchRelations = async (
  filters?: RelationFilters
): Promise<MediaRelation[]> => {
  try {
    return await withRetry(async () => {
      const response = await cmsApiClient.get('relations', { params: filters });
      return response.data;
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Create a new relation (attach asset to entity)
 * @param data - Relation creation data
 * @returns Promise<MediaRelation>
 */
export const createRelation = async (
  data: CreateRelationDto
): Promise<MediaRelation> => {
  try {
    const response = await cmsApiClient.post('relations', data);
    return response.data;
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Delete a relation (detach asset from entity)
 * @param id - Relation ID
 * @returns Promise<void>
 */
export const deleteRelation = async (id: number): Promise<void> => {
  try {
    await cmsApiClient.delete(`relations/${id}`);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Reorder relations by updating display_order values
 * @param order - Array of relation IDs with new display_order values
 * @returns Promise<void>
 */
export const reorderRelations = async (
  order: ReorderRelationDto[]
): Promise<void> => {
  try {
    await cmsApiClient.patch('relations/reorder', { order });
  } catch (error) {
    throw transformCMSError(error);
  }
};
