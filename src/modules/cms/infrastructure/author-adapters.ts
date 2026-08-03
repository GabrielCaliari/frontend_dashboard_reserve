import { cmsApiClient } from "@/src/infraestructure/axios/api";
import type {
  Author,
  AuthorApiResponse,
  CreateAuthorDto,
  UpdateAuthorDto,
  AssignAvatarDto,
} from "@/src/shared/domain/types/@cms-author";
import {
  withRetry,
  transformCMSError,
} from "@/src/shared/utils/cms-error-handler";

export type { CreateAuthorDto, UpdateAuthorDto, AssignAvatarDto };

/**
 * Normalize a raw API response into the UI Author shape.
 * The backend has returned both snake_case and camelCase fields across endpoints.
 */
function normalizeAuthor(raw: Record<string, any>): Author {
  const firstName = raw.first_name ?? raw.firstName ?? "";
  const lastName = raw.last_name ?? raw.lastName ?? "";
  const avatar = raw.avatar ?? undefined;
  const avatarId = raw.avatar_id ?? raw.avatarId ?? avatar?.id ?? undefined;
  const avatarUrl = raw.avatar_url ?? raw.avatarUrl ?? avatar?.url ?? undefined;
  const fullName =
    raw.full_name ?? raw.fullName ?? `${firstName} ${lastName}`.trim() ?? "";

  return {
    id: raw.id,
    tenant_id: raw.tenant_id,
    firstName,
    lastName,
    fullName,
    biography: raw.biography ?? undefined,
    avatarId,
    avatar_url: avatarUrl,
    avatar,
    active: raw.active ?? true,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

/**
 * Fetch all authors for the current tenant (AUTHENTICATED)
 */
export const fetchAuthors = async (
  active?: boolean,
  page: number = 1,
  limit: number = 30,
): Promise<Author[]> => {
  try {
    return await withRetry(async () => {
      const params: Record<string, any> = { page, limit, expand: "avatar" };
      if (active !== undefined) {
        params.active = active;
      }

      const response = await cmsApiClient.get("cms/authors", { params });

      // { data: AuthorApiResponse[], pagination: {...} }
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data.map(normalizeAuthor);
      }

      if (response.data && Array.isArray(response.data.items)) {
        return response.data.items.map(normalizeAuthor);
      }

      if (response.data && Array.isArray(response.data.results)) {
        return response.data.results.map(normalizeAuthor);
      }

      // Fallback for direct array response
      if (Array.isArray(response.data)) {
        return response.data.map(normalizeAuthor);
      }

      return [];
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Fetch a single author by ID (AUTHENTICATED)
 */
export const fetchAuthorById = async (authorId: string): Promise<Author> => {
  try {
    return await withRetry(async () => {
      const response = await cmsApiClient.get(`cms/authors/${authorId}`);
      return normalizeAuthor(response.data);
    });
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Create a new author (AUTHENTICATED)
 * Body stays in camelCase — the backend accepts firstName/lastName.
 */
export const createAuthor = async (data: CreateAuthorDto): Promise<Author> => {
  try {
    const payload: Record<string, any> = { ...data };
    if (!payload.avatarId) delete payload.avatarId;
    const response = await cmsApiClient.post("cms/authors", payload);
    return normalizeAuthor(response.data);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Update an existing author (AUTHENTICATED)
 */
export const updateAuthor = async (
  authorId: string,
  data: UpdateAuthorDto,
): Promise<Author> => {
  try {
    const payload: Record<string, any> = { ...data };
    if (!payload.avatarId) delete payload.avatarId;
    const response = await cmsApiClient.put(`cms/authors/${authorId}`, payload);
    return normalizeAuthor(response.data);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Delete an author (AUTHENTICATED)
 * Returns 400 if the author has published articles.
 */
export const deleteAuthor = async (authorId: string): Promise<void> => {
  try {
    await cmsApiClient.delete(`cms/authors/${authorId}`);
  } catch (error) {
    throw transformCMSError(error);
  }
};

/**
 * Assign an existing media asset as the author's avatar (AUTHENTICATED)
 * POST /api/cms/authors/:id/avatar
 */
export const assignAuthorAvatar = async (
  authorId: string,
  avatarId: string,
): Promise<Author> => {
  try {
    const response = await cmsApiClient.post(`cms/authors/${authorId}/avatar`, {
      avatarId,
    });
    return normalizeAuthor(response.data);
  } catch (error) {
    throw transformCMSError(error);
  }
};
