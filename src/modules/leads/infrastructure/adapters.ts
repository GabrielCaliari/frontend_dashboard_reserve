/**
 * Leads — Infrastructure Adapters
 *
 * Consolidates the former `common/services/leads/*` (17 functions covering leads and
 * lead collections) into a single adapter module. Every exported function name and
 * signature is preserved unchanged so consuming hooks/actions only need their import
 * path updated — with one exception documented below (`listLeadsLegacy`).
 *
 * Backend module: `reserve-leads`. Generated typed clients live in
 * `src/infraestructure/server/services/{leads,lead-collections}` (see Task 11 codegen).
 * They are NOT delegated to here because, on inspection of their `types.ts`:
 *   - every single response type is `type XResponse = unknown` (no structural type at
 *     all — `createLead`, `findLeads`, `findLeadById`, `updateLead`, `deleteLead`,
 *     `getLeadAttachments`, `addAttachment`, `removeAttachment`, `updateLeadStatus`,
 *     and all lead-collections operations return `unknown`), so delegating would still
 *     require an unchecked cast at every call site with no type-safety gain;
 *   - `leadsService.updateLeadStatus(id)` (generated) has NO body parameter at all,
 *     while the hand-written `updateLeadStatusService(id, data: UpdateLeadStatusDto)`
 *     sends a required status payload via PUT — the generated client cannot express
 *     this call today, so delegating would silently drop the status change;
 *   - `FindLeadsParams` (generated) types `page`/`limit` as `string`, while the
 *     hand-written `listLeadsService` and every call site pass `number` — another
 *     mismatch that would require casts.
 * Given the same pattern already found in Task 12 (access-management) plus a concrete
 * functional gap (missing body on updateLeadStatus), this adapter keeps the original
 * `apiClient`-based implementations verbatim. All URL paths and normalization logic
 * here match the pre-migration services exactly.
 *
 * Naming exception: the orphaned `common/services/list-leads-service.ts` (calling the
 * non-existent `GET /auth/leads`) also exported a function named `listLeadsService`,
 * colliding with the real `listLeadsService` below (which correctly calls `GET /leads`
 * and is now delegate-free for the reasons above). It is renamed here to
 * `listLeadsLegacy` — the only behavior-preserving way to keep both in one module.
 * Its single call site (`src/presentation/actions/list-leads.ts`) was updated to match.
 * See `ORPHANED-ENDPOINTS.md` for the full list of orphaned endpoints.
 */

import { apiClient } from "@/src/infraestructure/axios/api";
import { errorTypes } from "@/src/infraestructure/axios/error-types";
import type {
  LeadAttachment,
  AddAttachmentDto,
  CollectionDetailResponse,
  CreateCollectionDto,
  CreateLeadDto,
  LeadDetailResponse,
  LeadListResponse,
  CollectionListResponse,
  RegenerateKeyResponse,
  UpdateCollectionDto,
  UpdateLeadDto,
  UpdateLeadStatusDto,
} from "@/src/shared/domain/types/@lead";

// ============================================================================
// Lead Service (formerly common/services/leads/*)
// ============================================================================

/** Add an attachment to a lead. */
export async function addLeadAttachmentService(
  leadId: string,
  data: AddAttachmentDto,
): Promise<LeadAttachment> {
  const response = await apiClient.post<LeadAttachment>(
    `/leads/${leadId}/attachments`,
    data,
  );
  return response.data;
}

/** Create a new lead collection. */
export async function createCollectionService(
  data: CreateCollectionDto,
): Promise<CollectionDetailResponse> {
  const response = await apiClient.post<CollectionDetailResponse>(
    "/leads/collections",
    data,
  );
  return response.data;
}

/** Create a new lead. */
export async function createLeadService(
  data: CreateLeadDto,
): Promise<LeadDetailResponse> {
  const response = await apiClient.post<LeadDetailResponse>("/leads", data);
  return response.data;
}

/** Delete (deactivate) a lead collection. */
export async function deleteCollectionService(
  id: string,
): Promise<CollectionDetailResponse> {
  const response = await apiClient.delete<CollectionDetailResponse>(
    `/leads/collections/${id}`,
  );
  return response.data;
}

/** Delete a lead. */
export async function deleteLeadService(
  id: string,
): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(`/leads/${id}`);
  return response.data;
}

interface GetCollectionLeadsParams {
  page?: number;
  limit?: number;
}

/** Fetch paginated leads within a specific collection. */
export async function getCollectionLeadsService(
  collectionId: string,
  params: GetCollectionLeadsParams = {},
): Promise<LeadListResponse> {
  const { page = 1, limit = 30 } = params;
  const response = await apiClient.get<LeadListResponse>(
    `/leads/collections/${collectionId}/leads`,
    { params: { page, limit } },
  );
  return response.data;
}

/** Fetch a single lead collection by ID. */
export async function getCollectionService(
  id: string,
): Promise<CollectionDetailResponse> {
  const response = await apiClient.get<CollectionDetailResponse>(
    `/leads/collections/${id}`,
  );
  return response.data;
}

/** Fetch a single lead by ID. */
export async function getLeadService(id: string): Promise<LeadDetailResponse> {
  const response = await apiClient.get<LeadDetailResponse>(`/leads/${id}`);
  return response.data;
}

interface ListAllCollectionLeadsParams {
  page?: number;
  limit?: number;
}

/** List leads across all of the tenant's collections. */
export async function listAllCollectionLeadsService(
  params: ListAllCollectionLeadsParams = {},
): Promise<LeadListResponse> {
  const { page = 1, limit = 30 } = params;
  const response = await apiClient.get<LeadListResponse>(
    "/leads/collections/leads",
    {
      params: { page, limit },
    },
  );
  return response.data;
}

interface ListCollectionsParams {
  page?: number;
  limit?: number;
  active?: boolean;
}

/** List lead collections for the tenant. */
export async function listCollectionsService(
  params: ListCollectionsParams = {},
): Promise<CollectionListResponse> {
  const { page = 1, limit = 10, active } = params;
  const response = await apiClient.get<CollectionListResponse>(
    "/leads/collections",
    {
      params: { page, limit, ...(active !== undefined && { active }) },
    },
  );
  return response.data;
}

/** List attachments for a lead. */
export async function listLeadAttachmentsService(
  leadId: string,
): Promise<{ data: LeadAttachment[] }> {
  const response = await apiClient.get<{ data: LeadAttachment[] }>(
    `/leads/${leadId}/attachments`,
  );
  return response.data;
}

interface ListLeadsParams {
  page?: number;
  limit?: number;
  status?: number;
  origin?: number;
}

/** List leads (correct, functional endpoint: `GET /leads`). */
export async function listLeadsService(
  params: ListLeadsParams = {},
): Promise<LeadListResponse> {
  const { page = 1, limit = 30, status, origin } = params;

  const queryParams: Record<string, any> = { page, limit };
  if (status !== undefined) queryParams.status = status;
  if (origin !== undefined) queryParams.origin = origin;

  const response = await apiClient.get<LeadListResponse>("/leads", {
    params: queryParams,
  });

  return response.data;
}

/** Regenerate a lead collection's public submission key. */
export async function regenerateCollectionKeyService(
  id: string,
): Promise<RegenerateKeyResponse> {
  const response = await apiClient.post<RegenerateKeyResponse>(
    `/leads/collections/${id}/regenerate-key`,
  );
  return response.data;
}

/** Remove an attachment from a lead. */
export async function removeLeadAttachmentService(
  leadId: string,
  attachmentId: number,
): Promise<{ success: boolean }> {
  const response = await apiClient.delete<{ success: boolean }>(
    `/leads/${leadId}/attachments/${attachmentId}`,
  );
  return response.data;
}

/** Update a lead collection. */
export async function updateCollectionService(
  id: string,
  data: UpdateCollectionDto,
): Promise<CollectionDetailResponse> {
  const response = await apiClient.put<CollectionDetailResponse>(
    `/leads/collections/${id}`,
    data,
  );
  return response.data;
}

/** Update a lead. */
export async function updateLeadService(
  id: string,
  data: UpdateLeadDto,
): Promise<LeadDetailResponse> {
  const response = await apiClient.patch<LeadDetailResponse>(
    `/leads/${id}`,
    data,
  );
  return response.data;
}

/** Update a lead's status. */
export async function updateLeadStatusService(
  id: string,
  data: UpdateLeadStatusDto,
): Promise<LeadDetailResponse> {
  const response = await apiClient.put<LeadDetailResponse>(
    `/leads/${id}/status`,
    data,
  );
  return response.data;
}

// ============================================================================
// Orphaned endpoints (formerly loose files under common/services/)
//
// The 8 functions below call routes that do NOT exist in backend_reserve. They are
// moved unchanged (same body, same error handling) so runtime behavior is identical
// to before the migration — the calls will still 404. See ORPHANED-ENDPOINTS.md.
// ============================================================================

// TODO(arquitetura): endpoint não existe em backend_reserve — ver ORPHANED-ENDPOINTS.md
export const listLeadQualificationService = async () => {
  try {
    const response = await apiClient.get(`/auth/leads/qualification`);

    return response.data;
  } catch (error: any) {
    if (error.response.data.code) {
      return error.response.data.code;
    }

    return errorTypes._500.list_trademark_registration_leads;
  }
};

// TODO(arquitetura): endpoint não existe em backend_reserve — ver ORPHANED-ENDPOINTS.md
export const updateLeadQualificationService = async ({
  lead_id,
  card,
}: {
  lead_id: string;
  card: string;
}) => {
  try {
    const response = await apiClient.put(`/auth/leads/${lead_id}/qualification`, {
      card,
    });

    return response.data;
  } catch (error: any) {
    if (error.response.data.code) {
      return error.response.data.code;
    }

    return errorTypes._500.update_lead;
  }
};

// TODO(arquitetura): endpoint não existe em backend_reserve — ver ORPHANED-ENDPOINTS.md
// Renamed from `listLeadsService` (original name) to avoid colliding with the real,
// functional `listLeadsService` above. See the file-level comment for details.
export const listLeadsLegacy = async ({ page = 1 }: { page?: number }) => {
  try {
    const response = await apiClient.get("/auth/leads", {
      params: {
        page,
      },
    });

    if (response.status !== 200) {
      throw response.data;
    }

    return response.data;
  } catch (error: any) {
    if (error.response.data.code) {
      return error.response.data.code;
    }

    return errorTypes._500.list_leads;
  }
};

// TODO(arquitetura): endpoint não existe em backend_reserve — ver ORPHANED-ENDPOINTS.md
export const completeScreeningService = async ({
  lead_id,
}: {
  lead_id: string;
}) => {
  try {
    const response = await apiClient.post(
      `/auth/leads/${lead_id}/complete-screening`,
    );

    if (response.status === 200) {
      return true;
    }

    return false;
  } catch (error: any) {
    if (error.response.data.code) {
      return error.response.data.code;
    }

    return false;
  }
};

// TODO(arquitetura): endpoint não existe em backend_reserve — ver ORPHANED-ENDPOINTS.md
export const temperatureAnalysisByMessageIdService = async ({
  message_id,
}: {
  message_id: string;
}) => {
  try {
    const response = await apiClient.post(
      `/auth/leads/temperature-analysis/${message_id}`,
    );

    if (response.status !== 200) {
      throw response.data;
    }

    return true;
  } catch (error: any) {
    if (error.response.data.code) {
      return error.response.data.code;
    }

    return errorTypes._500.temperature_analysis_by_message;
  }
};

// TODO(arquitetura): endpoint não existe em backend_reserve — ver ORPHANED-ENDPOINTS.md
export const brandAnalyticsService = async (token: string, session: string) => {
  try {
    const response = await apiClient.get("/brand-analysis", {
      headers: {
        Authorization: `Bearer ${token}`,
        "session-id": session,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Erro os relatórios de análise de marca:", error);
    throw error;
  }
};

// TODO(arquitetura): endpoint não existe em backend_reserve — ver ORPHANED-ENDPOINTS.md
export const brandAnalyticsDetailService = async (
  id: number,
  token: string,
  session: string,
) => {
  try {
    const response = await apiClient.get(`/brand-analysis/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "session-id": session,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Erro os relatórios de análise de marca:", error);
    throw error;
  }
};

// TODO(arquitetura): endpoint não existe em backend_reserve — ver ORPHANED-ENDPOINTS.md
export const createBrandAnalytics = async (
  data: {
    brand: string;
    niche: string;
    description: string;
  },
  token: string,
  session: string,
) => {
  try {
    const response = await apiClient.post(
      "/brand-analysis",
      {
        ...data,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "session-id": session,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Erro os relatórios de análise de marca:", error);
    throw error;
  }
};
