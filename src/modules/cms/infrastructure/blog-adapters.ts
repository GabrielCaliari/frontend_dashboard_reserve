/**
 * CMS Blog — Infrastructure Adapters
 *
 * This file consolidates TWO historically separate, functionally overlapping
 * blog services that both existed in `common/services/`:
 *   - `cms-blog-service.ts` (function exports, `cmsApiClient`, error-transform +
 *     retry, response normalization for assets pagination) — section below.
 *   - `blog-service.ts` (a `blogService` object, plain `apiClient`, no retry/
 *     normalization) — section below, kept under the same exported name
 *     `blogService` since call sites already reference `blogService.xxx`.
 * They were NOT merged into one API because their consumers use different
 * shapes (named functions vs. a service object) and merging risks silently
 * changing behavior for one of the two call sites. Both are preserved verbatim.
 */
import api, { cmsApiClient } from "@/src/infraestructure/axios/api";
import type {
  MediaAsset,
  PaginatedResponse,
} from "@/src/shared/domain/types/@cms-media";
import type {
  Blog,
  CreateBlogDto,
  UpdateBlogDto,
} from "@/src/shared/domain/types/@cms-blog";
import {
  withRetry,
  transformCMSError,
} from "@/src/shared/utils/cms-error-handler";
import type {
  Blog as PlainBlog,
  BlogCreateInput,
  BlogUpdateInput,
  BlogListResponse,
  BlogSecretKeyResponse,
} from "@/src/shared/domain/types/@blog";

const getResponsePayload = <T>(payload: T | { data: T }): T => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    !Array.isArray(payload)
  ) {
    return payload.data as T;
  }

  return payload as T;
};

const normalizeBlogListPayload = (payload: unknown): Blog[] => {
  if (Array.isArray(payload)) {
    return payload as Blog[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const typedPayload = payload as {
    data?: unknown;
    blogs?: unknown;
    items?: unknown;
  };

  if (Array.isArray(typedPayload.blogs)) {
    return typedPayload.blogs as Blog[];
  }

  if (Array.isArray(typedPayload.items)) {
    return typedPayload.items as Blog[];
  }

  if (typedPayload.data) {
    return normalizeBlogListPayload(typedPayload.data);
  }

  return [];
};

const normalizePaginatedAssetsResponse = (
  payload: unknown,
  page = 1,
  limit = 20,
): PaginatedResponse<MediaAsset> => {
  if (payload && typeof payload === "object") {
    const typedPayload = payload as {
      data?: unknown;
      assets?: MediaAsset[];
      meta?: Record<string, number | undefined>;
      pagination?: Record<string, number | undefined>;
    };

    if (typedPayload.data && typeof typedPayload.data === "object") {
      return normalizePaginatedAssetsResponse(typedPayload.data, page, limit);
    }

    const data = Array.isArray(typedPayload.assets)
      ? typedPayload.assets
      : Array.isArray(typedPayload.data)
        ? (typedPayload.data as MediaAsset[])
        : [];

    const metaSource = typedPayload.meta ?? typedPayload.pagination;

    if (data.length > 0 || metaSource) {
      return {
        data,
        meta: {
          page: metaSource?.page ?? metaSource?.current_page ?? page,
          limit: metaSource?.limit ?? limit,
          total: metaSource?.total ?? metaSource?.total_records ?? data.length,
          totalPages:
            metaSource?.totalPages ??
            metaSource?.total_pages ??
            (data.length > 0 ? 1 : 0),
        },
      };
    }
  }

  if (Array.isArray(payload)) {
    return {
      data: payload as MediaAsset[],
      meta: {
        page,
        limit,
        total: payload.length,
        totalPages: payload.length > 0 ? 1 : 0,
      },
    };
  }

  return {
    data: [],
    meta: { page, limit, total: 0, totalPages: 0 },
  };
};

// ============================================================================
// cms-blog-service.ts (verbatim) — CMS Blog Service
// Encapsulates all blog-related API calls for the CMS system
// ============================================================================

/**
 * Fetch all blogs for the authenticated tenant
 * @returns Promise<Blog[]> - List of all blogs
 */
export const fetchBlogs = async (): Promise<Blog[]> => {
  try {
    return await withRetry(async () => {
      const response = await cmsApiClient.get("cms/blogs");
      return normalizeBlogListPayload(response.data);
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Fetch a single blog by ID
 * @param blogId - The ID of the blog to retrieve
 * @returns Promise<Blog> - The blog data
 */
export const fetchBlogById = async (blogId: string | number): Promise<Blog> => {
  try {
    const blogs = await fetchBlogs();
    const blog = blogs.find((b) => String(b.id) === String(blogId));
    if (!blog) throw new Error(`Blog not found: ${blogId}`);
    return blog;
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Create a new blog
 * @param data - Blog creation data (name and optional description)
 * @returns Promise<Blog> - The created blog with generated slug and secret_key
 */
export const createBlog = async (data: CreateBlogDto): Promise<Blog> => {
  try {
    const response = await cmsApiClient.post("cms/blogs", data);
    return getResponsePayload<Blog>(response.data);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Update an existing blog
 * @param blogId - The ID of the blog to update
 * @param data - Blog update data (name and/or description)
 * @returns Promise<Blog> - The updated blog data
 */
export const updateBlog = async (
  blogId: string | number,
  data: UpdateBlogDto,
): Promise<Blog> => {
  try {
    const response = await cmsApiClient.patch(`cms/blogs/${blogId}`, data);
    return getResponsePayload<Blog>(response.data);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Delete a blog
 * Cascades to delete all associated articles and images
 * @param blogId - The ID of the blog to delete
 * @returns Promise<void>
 */
export const deleteBlog = async (blogId: number): Promise<void> => {
  try {
    await cmsApiClient.delete(`cms/blogs/${blogId}`);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Regenerate the secret key for a blog
 * Immediately invalidates the previous secret key
 * @param blogId - The ID of the blog
 * @returns Promise<Blog> - The blog data with the new secret_key
 */
export const regenerateBlogSecretKey = async (
  blogId: number,
): Promise<Blog> => {
  try {
    const response = await cmsApiClient.post(
      `cms/blogs/${blogId}/regenerate-key`,
    );
    return getResponsePayload<Blog>(response.data);
  } catch (error) {
    throw transformCMSError(error);
  }
};

export const fetchBlogAssets = async (
  blogId: string | number,
  params?: { page?: number; limit?: number },
): Promise<PaginatedResponse<MediaAsset>> => {
  try {
    return await withRetry(async () => {
      const response = await cmsApiClient.get(`cms/blogs/${blogId}/assets`, {
        params,
      });

      return normalizePaginatedAssetsResponse(
        response.data,
        params?.page ?? 1,
        params?.limit ?? 20,
      );
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

export const uploadBlogAsset = async (
  blogId: string | number,
  data: { file: File; alt_text?: string; metadata?: Record<string, unknown> },
): Promise<MediaAsset> => {
  try {
    const formData = new FormData();
    formData.append("file", data.file);

    if (data.alt_text) {
      formData.append("alt_text", data.alt_text);
    }

    if (data.metadata) {
      formData.append("metadata", JSON.stringify(data.metadata));
    }

    const response = await cmsApiClient.post(
      `cms/blogs/${blogId}/assets`,
      formData,
    );
    return getResponsePayload<MediaAsset>(response.data);
  } catch (error) {
    throw transformCMSError(error);
  }
};

// ============================================================================
// blog-service.ts (verbatim) — plain `blogService` object
// ============================================================================

export const blogService = {
  // List all blogs (tenant_id via header x-tenant-id)
  async listBlogs(page?: number, limit?: number): Promise<BlogListResponse> {
    const params: Record<string, number> = {};
    if (page !== undefined) params.page = page;
    if (limit !== undefined) params.limit = limit;

    console.log("Fetching blogs with params:", params);
    const response = await api.get("/cms/blogs", {
      params: Object.keys(params).length > 0 ? params : undefined,
    });
    console.log("Blogs response:", response.data);

    // Se a resposta já tem a estrutura correta, retorna direto
    if (response.data && Array.isArray(response.data.data)) {
      return response.data;
    }

    // Se a resposta é um array direto, normaliza para o formato esperado
    if (Array.isArray(response.data)) {
      return {
        data: response.data,
        meta: {
          page: page || 1,
          limit: limit || 10,
          total: response.data.length,
          total_pages: 1,
        },
      };
    }

    // Fallback: retorna estrutura vazia
    return {
      data: [],
      meta: {
        page: page || 1,
        limit: limit || 10,
        total: 0,
        total_pages: 0,
      },
    };
  },

  // Get single blog by deriving from list (GET /api/cms/blogs/:blogId does not exist)
  async getBlog(blogId: number): Promise<PlainBlog> {
    const listResponse = await this.listBlogs(1, 200);
    const blog = listResponse.data.find((b) => b.id === blogId);
    if (!blog) throw new Error(`Blog not found: ${blogId}`);
    return blog;
  },

  // Create blog
  async createBlog(data: BlogCreateInput): Promise<PlainBlog> {
    const response = await api.post("/cms/blogs", data);
    return response.data;
  },

  // Update blog
  async updateBlog(blogId: number, data: BlogUpdateInput): Promise<PlainBlog> {
    const response = await api.put(`/cms/blogs/${blogId}`, data);
    return response.data;
  },

  // Delete blog
  async deleteBlog(blogId: number): Promise<void> {
    await api.delete(`/cms/blogs/${blogId}`);
  },

  // Regenerate secret key
  async regenerateSecretKey(blogId: number): Promise<BlogSecretKeyResponse> {
    const response = await api.post(`/cms/blogs/${blogId}/regenerate-key`);
    return response.data;
  },
};
