import { cmsApiClient } from '@/src/common/config/api';
import { withRetry, transformCMSError } from '@/src/common/utils/cms-error-handler';
import type {
  CmsMediaId,
  MediaCollection,
  MediaAsset,
  MediaRelation,
  PaginationParams,
  PaginatedResponse,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  UploadAssetRequest,
  UpdateAssetRequest,
  CreateRelationRequest,
  ReorderRelationsRequest,
  CollectionListParams,
  AssetListParams,
} from '@/src/common/@types/@cms-media';

/**
 * CMS Media Storage Service
 * Handles collections, assets, and relations for the CMS media storage system
 */

export type CreateCollectionDto = CreateCollectionRequest;
export type UpdateCollectionDto = UpdateCollectionRequest;
export type UploadAssetDto = UploadAssetRequest;
export type UpdateAssetDto = UpdateAssetRequest;
export type CreateRelationDto = CreateRelationRequest;
export type ReorderRelationDto = ReorderRelationsRequest['relations'][number];
export type CollectionFilters = CollectionListParams;
export type AssetFilters = AssetListParams;

const getResponsePayload = <T>(payload: T | { data: T }): T => {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    !Array.isArray(payload)
  ) {
    return payload.data as T;
  }

  return payload as T;
};

const getNestedArrayPayload = <T>(payload: unknown): T[] | null => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidateKeys = ['data', 'collections', 'assets', 'relations', 'items'];

  for (const key of candidateKeys) {
    const value = (payload as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      return value as T[];
    }
  }

  return null;
};

const getPaginationPayload = (
  payload: unknown,
): Record<string, number | undefined> | undefined => {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const directMeta = (payload as Record<string, unknown>).meta;
  if (directMeta && typeof directMeta === 'object') {
    return directMeta as Record<string, number | undefined>;
  }

  const directPagination = (payload as Record<string, unknown>).pagination;
  if (directPagination && typeof directPagination === 'object') {
    return directPagination as Record<string, number | undefined>;
  }

  return undefined;
};

const normalizePaginatedResponse = <T>(
  payload: unknown,
  params?: PaginationParams,
): PaginatedResponse<T> => {
  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    (payload as { data?: unknown }).data &&
    typeof (payload as { data?: unknown }).data === 'object' &&
    (
      'data' in ((payload as { data: Record<string, unknown> }).data) ||
      'collections' in ((payload as { data: Record<string, unknown> }).data) ||
      'assets' in ((payload as { data: Record<string, unknown> }).data) ||
      'relations' in ((payload as { data: Record<string, unknown> }).data) ||
      'items' in ((payload as { data: Record<string, unknown> }).data)
    )
  ) {
    return normalizePaginatedResponse<T>(
      (payload as { data: unknown }).data,
      params,
    );
  }

  const nestedArrayPayload = getNestedArrayPayload<T>(payload);

  if (nestedArrayPayload) {
    const paginationPayload = getPaginationPayload(payload);

    return {
      data: nestedArrayPayload,
      meta: {
        page:
          paginationPayload?.page ??
          paginationPayload?.current_page ??
          params?.page ??
          1,
        limit:
          paginationPayload?.limit ??
          params?.limit ??
          nestedArrayPayload.length ??
          20,
        total:
          paginationPayload?.total ??
          paginationPayload?.total_records ??
          nestedArrayPayload.length,
        totalPages:
          paginationPayload?.totalPages ??
          paginationPayload?.total_pages ??
          (nestedArrayPayload.length > 0 ? 1 : 0),
      },
    };
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Array.isArray((payload as PaginatedResponse<T>).data)
  ) {
    const typedPayload = payload as {
      data: T[];
      meta?: Record<string, number | undefined>;
    };

    return {
      data: typedPayload.data,
      meta: {
        page:
          typedPayload.meta?.page ??
          typedPayload.meta?.current_page ??
          params?.page ??
          1,
        limit:
          typedPayload.meta?.limit ??
          params?.limit ??
          typedPayload.data.length ??
          20,
        total:
          typedPayload.meta?.total ??
          typedPayload.meta?.total_records ??
          typedPayload.data.length,
        totalPages:
          typedPayload.meta?.totalPages ??
          typedPayload.meta?.total_pages ??
          (typedPayload.data.length > 0 ? 1 : 0),
      },
    };
  }

  if (Array.isArray(payload)) {
    return {
      data: payload as T[],
      meta: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 20,
        total: payload.length,
        totalPages: payload.length > 0 ? 1 : 0,
      },
    };
  }

  return {
    data: [],
    meta: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 20,
      total: 0,
      totalPages: 0,
    },
  };
};

const normalizeRelationListResponse = (payload: unknown): MediaRelation[] => {
  if (Array.isArray(payload)) {
    return payload as MediaRelation[];
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'data' in payload &&
    Array.isArray((payload as { data: MediaRelation[] }).data)
  ) {
    return (payload as { data: MediaRelation[] }).data;
  }

  return [];
};

// ============================================================================
// Collection Methods
// ============================================================================

/**
 * Fetch all collections with optional pagination
 * @param params - Pagination parameters
 * @returns Promise<PaginatedResponse<MediaCollection>>
 */
export const fetchCollections = async (
  params?: CollectionFilters
): Promise<PaginatedResponse<MediaCollection>> => {
  try {
    return await withRetry(async () => {
      const response = await cmsApiClient.get('cms/collections', { params });
      return normalizePaginatedResponse<MediaCollection>(response.data, params);
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
export const fetchCollectionById = async (id: CmsMediaId): Promise<MediaCollection> => {
  try {
    return await withRetry(async () => {
      const response = await cmsApiClient.get(`cms/collections/${id}`);
      return getResponsePayload<MediaCollection>(response.data);
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
    const response = await cmsApiClient.post('cms/collections', data);
    return getResponsePayload<MediaCollection>(response.data);
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
  id: CmsMediaId,
  data: UpdateCollectionDto
): Promise<MediaCollection> => {
  try {
    const response = await cmsApiClient.put(`cms/collections/${id}`, data);
    return getResponsePayload<MediaCollection>(response.data);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Delete a collection
 * @param id - Collection ID
 * @returns Promise<void>
 */
export const deleteCollection = async (id: CmsMediaId): Promise<void> => {
  try {
    await cmsApiClient.delete(`cms/collections/${id}`);
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
      const response = await cmsApiClient.get('cms/assets', { params: queryParams });
      return normalizePaginatedResponse<MediaAsset>(response.data, params);
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

export const fetchCollectionAssets = async (
  collectionId: CmsMediaId,
  params?: PaginationParams,
): Promise<PaginatedResponse<MediaAsset>> => {
  try {
    return await withRetry(async () => {
      const response = await cmsApiClient.get(`cms/collections/${collectionId}/assets`, {
        params,
      });

      return normalizePaginatedResponse<MediaAsset>(response.data, params);
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
export const fetchAssetById = async (id: CmsMediaId): Promise<MediaAsset> => {
  try {
    return await withRetry(async () => {
      const response = await cmsApiClient.get(`cms/assets/${id}`);
      return getResponsePayload<MediaAsset>(response.data);
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
    formData.append('collection_id', data.collection_id);
    
    if (data.alt_text) {
      formData.append('alt_text', data.alt_text);
    }
    
    if (data.metadata) {
      formData.append('metadata', JSON.stringify(data.metadata));
    }

    const response = await cmsApiClient.post('cms/assets', formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return getResponsePayload<MediaAsset>(response.data);
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
  id: CmsMediaId,
  data: UpdateAssetDto
): Promise<MediaAsset> => {
  try {
    const response = await cmsApiClient.patch(`cms/assets/${id}`, data);
    return getResponsePayload<MediaAsset>(response.data);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Delete an asset
 * @param id - Asset ID
 * @returns Promise<void>
 */
export const deleteAsset = async (id: CmsMediaId): Promise<void> => {
  try {
    await cmsApiClient.delete(`cms/assets/${id}`);
  } catch (error) {
    throw transformCMSError(error);
  }
};

export const deleteCollectionAsset = async (
  collectionId: CmsMediaId,
  assetId: CmsMediaId,
): Promise<void> => {
  try {
    await cmsApiClient.delete(`cms/collections/${collectionId}/assets/${assetId}`);
  } catch (error) {
    throw transformCMSError(error);
  }
};

// ============================================================================
// Relation Methods
// ============================================================================

/**
 * Fetch relations for a specific entity
 * @param entityType - Entity type (article, brand, company, etc.)
 * @param entityId - Entity identifier (UUID or int as string)
 * @param relationType - Optional relation type filter (featured, gallery, etc.)
 * @returns Promise<MediaRelation[]>
 */
export const fetchRelations = async (
  entityType: string,
  entityId: string,
  relationType?: string
): Promise<MediaRelation[]> => {
  try {
    return await withRetry(async () => {
      const params: Record<string, string> = {};
      if (relationType) {
        params.relation_type = relationType;
      }
      const response = await cmsApiClient.get(`cms/relations/${entityType}/${entityId}`, { params });
      return normalizeRelationListResponse(response.data);
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Attach an asset to an entity (create relation)
 * @param data - Relation creation data with entity_id_type and relation_type
 * @returns Promise<MediaRelation>
 */
export const createRelation = async (
  data: CreateRelationDto
): Promise<MediaRelation> => {
  try {
    const response = await cmsApiClient.post('cms/relations/attach', data);
    return getResponsePayload<MediaRelation>(response.data);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Detach an asset from an entity (delete relation)
 * @param data - Detach data identifying the relation
 * @returns Promise<void>
 */
export const deleteRelation = async (
  data: { asset_id: CmsMediaId; entity_type: string; entity_id: string; relation_type?: string }
): Promise<void> => {
  try {
    await cmsApiClient.post('cms/relations/detach', data);
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
  data: ReorderRelationsRequest
): Promise<void> => {
  try {
    await cmsApiClient.put('cms/relations/reorder', {
      ...data,
      order: data.relations,
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};
