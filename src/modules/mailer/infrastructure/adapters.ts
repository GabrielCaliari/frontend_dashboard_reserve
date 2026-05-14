/**
 * Mailer — Infrastructure Adapters
 *
 * Consolidates the former `common/services/email-campaign/*` (12 functions),
 * `common/services/campaign-batch/*` (4 functions), and
 * `common/services/smtp-server/*` (1 function) into a single adapter module.
 * Every exported function name and signature is preserved unchanged so
 * consuming actions/components only need their import path updated (default
 * imports were converted to named imports at each call site, matching the
 * convention already used by the `access-management` and `leads` adapters).
 *
 * Backend module: `mailer`. Generated typed clients live in
 * `src/infraestructure/server/services/{email-campaign,config}` (see Task 11
 * codegen). They are NOT delegated to here because inspection of both the
 * generated `index.ts`/`types.ts` and the 17 hand-written services above
 * turned up real functional gaps, not just cosmetic ones:
 *
 *   - URL path mismatch: the generated `emailCampaignService` calls
 *     `POST /api/mailer`, `GET /api/mailer`, `GET /api/mailer/{id}`, etc.
 *     (no `/campaigns` segment), while every hand-written service here calls
 *     `/mailer/campaigns`, `/mailer/campaigns/{id}`, etc. Both clients share
 *     the same `apiClient` / `buildApiBaseUrl` (baseURL already ends in
 *     `/api`, and `normalizeApiRequestUrl` only strips a leading `/api` from
 *     the request path — it never inserts `/campaigns`), so these resolve to
 *     genuinely different backend routes. The generated client would hit the
 *     wrong endpoint.
 *   - Missing functions entirely: the generated `emailCampaignService` only
 *     exposes 7 operations (create, list, getById, updateCopyVariant,
 *     updateCampaignBatchSize, closeSetup, pauseCampaign, resumeCampaign).
 *     It has NO equivalent for `createPrimaryCopyService`,
 *     `listBatchesByEmailCampaignService`,
 *     `listPrimaryCopyByEmailCampaignService`, `updateMetricsService`,
 *     `uploadLeadsService`, or `startCampaignService` (the generated
 *     `pauseCampaign`/`resumeCampaign` also have no hand-written counterpart
 *     — they are unused today). The entire `campaign-batch` domain (4
 *     functions: list deliveries, list emails, update batch email, update
 *     batch copy) is absent from the generated services altogether — there
 *     is no generated client for it at all.
 *   - SMTP path/casing mismatch: the generated `configService.findSmtpServers`
 *     calls `GET /api/mailer/smtp-server` (singular), while
 *     `listSmtpServersServices` calls `/mailer/smtp-servers` (plural) — a
 *     different route. The generated `createSmtpServer` also has no
 *     hand-written counterpart to compare against.
 *   - Parameter shape mismatch: `updateCampaignBatchSize`/`updateCopyVariant`
 *     take a positional `batchSize: number` / `copyVariant: ECopyVariationType`
 *     value and wrap it into `{ campaign_batch_size }` / `{ copy_variation_type: +v }`
 *     by hand; the generated client expects the caller to already build the
 *     `UpdateCampaignBatchSizeBody` / `UpdateCopyVariantBody` object, which is
 *     a different call-site contract than what every current consumer uses.
 *
 * Given these are not cosmetic differences (wrong routes, missing
 * operations) rather than just typing gaps, delegating would silently break
 * `campaign-batch` and several `email-campaign` operations. This adapter
 * keeps the original `apiClient`-based implementations verbatim (same
 * routes, same error handling, same messages). All URL paths and
 * normalization logic here match the pre-migration services exactly.
 */

import api from "@/src/infraestructure/axios/api";
import { errorTypes } from "@/src/infraestructure/axios/error-types";
import { ICreateEmailCampaign, ECopyVariationType } from "@/src/shared/domain/types/@email-campaign";
import { ICreatePrimaryCopy } from "@/src/shared/domain/types/@email-builder";

// ============================================================================
// Email Campaign Service (formerly common/services/email-campaign/*)
// ============================================================================

/** Close campaign setup. */
export const closeSetupService = async (campaignId: string) => {
  try {
    const response = await api.post(
      `/mailer/campaigns/${campaignId}/close-setup`,
    );

    return {
      id: response.data.id,
    };
  } catch (err: any) {
    if (err.response && err.response.data.code) {
      let message = "";

      switch (err.response.data.code) {
        default:
          message = "Erro ao fechar setup da campanha.";
          break;
      }

      return {
        error: true,
        message: message,
      };
    }

    return {
      error: true,
      message: "Erro ao fechar setup da campanha.",
    };
  }
};

/** Create email campaign. */
export const createEmailCampaignService = async (
  data: ICreateEmailCampaign,
) => {
  try {
    const response = await api.post("/mailer/campaigns", data);

    return {
      id: response.data.id,
    };
  } catch (err: any) {
    if (err.response && err.response.data.code) {
      let message = "";

      switch (err.response.data.code) {
        case errorTypes._400.smtp_server_not_found:
          message = "Nenhum servidor SMTP encontrado.";
          break;
        default:
          message = "Erro ao criar campanha.";
          break;
      }

      return {
        error: true,
        message: message,
      };
    }

    return {
      error: true,
      message: "Erro ao criar campanha.",
    };
  }
};

/** Create primary copy variant for a campaign. */
export async function createPrimaryCopyService(
  id: string,
  data: ICreatePrimaryCopy,
) {
  try {
    const response = await api.post(
      `/mailer/campaigns/${id}/primary-copy`,
      data,
    );

    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data.code) {
      let message = "";

      switch (error.response.data.code) {
        case errorTypes._404.email_campaign_not_found:
          message = "Campanha não encontrada.";
          break;
        case errorTypes._500.create_primary_copy_variant:
          message =
            "Não foi possível criar uma nova variante de copy primária.";
          break;
        default:
          message = "Erro ao criar copy primária.";
          break;
      }

      return {
        error: true,
        message: message,
      };
    }

    return {
      error: true,
      message: "Erro ao criar copy primária.",
    };
  }
}

/** List batches (dispatches) of an email campaign. */
export async function listBatchesByEmailCampaignService(
  emailCampaignId: string,
) {
  try {
    const response = await api.get(
      `/mailer/campaigns/${emailCampaignId}/batches`,
    );
    return response.data;
  } catch (err: any) {
    // TODO: Adicionar mensagem de erro para tratamento
    return {
      error: true,
      message: "Erro ao listar os disparos da campanha de e-mail.",
    };
  }
}

/** Get an email campaign by ID. */
export async function listEmailCampaignByIdService(id: string) {
  try {
    const response = await api.get(`/mailer/campaigns/${id}`);
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.data.code) {
      let message = "";

      switch (err.response.data.code) {
        case errorTypes._404.email_campaign_not_found:
        default:
          message = "Campanha de e-mail não encontrada.";
          break;
      }

      return {
        error: true,
        message: message,
      };
    }

    return {
      error: true,
      message: "Erro ao listar a campanha de e-mail.",
    };
  }
}

/** List email campaigns. */
export async function listEmailCampaignService() {
  try {
    const response = await api.get("/mailer/campaigns");
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.data.code) {
      let message = "";

      switch (err.response.data.code) {
        case errorTypes._500.get_all_email_campaign:
        default:
          message = "Houve um erro ao listar as campanhas de e-mail.";
          break;
      }

      return {
        error: true,
        message: message,
      };
    }

    return {
      error: true,
      message: "Erro ao listar as campanhas de e-mail.",
    };
  }
}

/** List primary copy variant of an email campaign. */
export async function listPrimaryCopyByEmailCampaignService(
  id: string,
) {
  try {
    const response = await api.get(`/mailer/campaigns/${id}/primary-copy`);
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data.code) {
      let message = "";

      switch (error.response.data.code) {
        case errorTypes._404.email_campaign_not_found:
          message = "Campanha não encontrada.";
          break;
        case errorTypes._404.primary_copy_variant_not_found:
          return null;
          break;
        default:
          message = "Erro ao listar copy primária.";
          break;
      }

      return {
        error: true,
        message: message,
      };
    }

    return {
      error: true,
      message: "Erro ao listar copy primária.",
    };
  }
}

interface IStartCampaignResponse {
  error?: boolean;
  message?: string;
  data?: any;
}

/** Start campaign. */
export async function startCampaignService(
  campaignId: string,
): Promise<IStartCampaignResponse> {
  try {
    const url = `/mailer/campaigns/${campaignId}/start`;
    const resp = await api.post(url);
    return resp.data;
  } catch (err: any) {
    // Try to extract message from axios error
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Erro ao iniciar campanha";
    return { error: true, message };
  }
}

/** Update batch size. */
export async function updateCampaignBatchSizeService(
  campaignId: string,
  batchSize: number,
) {
  try {
    const response = await api.put(
      `/mailer/campaigns/${campaignId}/batch-size`,
      { campaign_batch_size: batchSize },
    );
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.data.code) {
      let message = "";

      switch (err.response.data.code) {
        case errorTypes._404.email_campaign_not_found:
          message = "Campanha de e-mail não encontrada.";
          break;
        default:
          message =
            "Erro ao atualizar o tamanho do lote da campanha de e-mail.";
          break;
      }

      return {
        error: true,
        message: message,
      };
    }

    return {
      error: true,
      message: "Erro ao atualizar o tamanho do lote da campanha de e-mail.",
    };
  }
}

/** Update copy variation type. */
export const updateEmailCampaignCopyVariantService = async (
  campaignId: string,
  copyVariant: ECopyVariationType,
) => {
  try {
    const response = await api.put(
      `/mailer/campaigns/${campaignId}/copy-variant`,
      {
        copy_variation_type: +copyVariant,
      },
    );

    return response.data;
  } catch (err: any) {
    if (err.response && err.response.data.code) {
      let message = "";

      switch (err.response.data.code) {
        case errorTypes._404.email_campaign_not_found:
          message = "Campanha de e-mail não encontrada.";
          break;
        default:
          message =
            "Erro ao atualizar a variante de cópia da campanha de e-mail.";
          break;
      }

      return {
        error: true,
        message: message,
      };
    }

    return {
      error: true,
      message: "Erro ao atualizar a variante de cópia da campanha de e-mail.",
    };
  }
};

interface IUpdateMetricsResponse {
  error?: boolean;
  message?: string;
  data?: any;
}

/** Update campaign metrics. */
export async function updateMetricsService(
  campaignId: string,
): Promise<IUpdateMetricsResponse> {
  try {
    const url = `/mailer/campaigns/${campaignId}/metrics`;
    const resp = await api.put(url);
    return resp.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.message ||
      "Erro ao atualizar métricas";
    return { error: true, message };
  }
}

/** Upload leads (CSV file) to a campaign. */
export const uploadLeadsService = async (campaignId: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("campaignId", campaignId);

    const response = await api.post(
      `/mailer/campaigns/${campaignId}/leads`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  } catch (err: any) {
    console.log(err);
    if (err.response && err.response.data.code) {
      let message = "";
      switch (err.response.data.code) {
        default:
          message = "Erro ao fazer upload dos leads.";
          break;
      }
      return {
        error: true,
        message: message,
      };
    }
    return {
      error: true,
      message: "Erro ao fazer upload dos leads.",
    };
  }
};

// ============================================================================
// Campaign Batch Service (formerly common/services/campaign-batch/*)
// ============================================================================

/** List deliveries of a campaign batch (dispatch). */
export async function listDeliveriesByCampaignBatchIdService(
  campaignBatchId: string,
) {
  try {
    const response = await api.get(
      `/mailer/batches/${campaignBatchId}/deliveries`,
    );
    return response.data;
  } catch (error) {
    // TODO: Adicionar mensagem de erro para tratamento
    return {
      error: true,
      message: "Erro ao listar as entregas do disparo.",
    };
  }
}

/** List emails of a campaign batch (dispatch). */
export async function listEmailByCampaignBatchIdService(
  campaignBatchId: string,
) {
  try {
    const response = await api.get(`/mailer/batches/${campaignBatchId}/emails`);
    return response.data;
  } catch (error) {
    // TODO: Adicionar mensagem de erro para tratamento
    return {
      error: true,
      message: "Erro ao listar os emails do disparo.",
    };
  }
}

/** Update the email content of a campaign batch (dispatch). */
export async function updateCampaignBatchEmailService(
  campaignBatchId: string,
  data: ICreatePrimaryCopy,
) {
  try {
    const response = await api.put(
      `/mailer/batches/${campaignBatchId}/email`,
      data,
    );

    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data.code) {
      let message = "";

      switch (error.response.data.code) {
        case errorTypes._404.email_campaign_not_found:
          message = "Disparo não encontrado.";
          break;
        default:
          message = "Erro ao atualizar email do disparo.";
          break;
      }

      return {
        error: true,
        message: message,
      };
    }

    return {
      error: true,
      message: "Erro ao atualizar email do disparo.",
    };
  }
}

/** Update the copy of a campaign batch (dispatch) email. */
export async function updateCopyEmailByCampaignBatchIdService(
  campaignBatchId: string,
  data: any,
) {
  try {
    const response = await api.put(
      `/mailer/batches/${campaignBatchId}/copy`,
      data,
    );
    return response.data;
  } catch (error) {
    // TODO: Adicionar mensagem de erro para tratamento
    return {
      error: true,
      message: "Erro ao atualizar o email do disparo.",
    };
  }
}

// ============================================================================
// SMTP Server Service (formerly common/services/smtp-server/*)
// ============================================================================

/** List SMTP servers. */
export async function listSmtpServersServices() {
  try {
    const response = await api.get("/mailer/smtp-servers");
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.data.code) {
      let message = "";

      switch (err.response.data.code) {
        case errorTypes._500.get_smtp_servers:
        default:
          message = "Houve um erro ao listar os servidores SMTP.";
          break;
      }

      return {
        error: true,
        message: message,
      };
    }

    return {
      error: true,
      message: "Erro ao listar os servidores SMTP.",
    };
  }
}
