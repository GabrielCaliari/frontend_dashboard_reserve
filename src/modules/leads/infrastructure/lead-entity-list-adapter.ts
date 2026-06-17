import { listLeadsService } from "@/src/modules/leads/infrastructure/adapters";
import type {
  EntityListRequest,
  EntityPage,
} from "@/src/presentation/components/organisms/entity-list/types";
import type { Lead } from "@/src/shared/domain/types/@lead";

export interface LeadEntityFilters extends Record<string, unknown> {
  status: string;
  origin: string;
}

export async function queryLeadEntityList(
  request: EntityListRequest<LeadEntityFilters>,
): Promise<EntityPage<Lead>> {
  const response = await listLeadsService({
    page: request.page,
    limit: request.pageSize,
    status: request.filters.status ? Number(request.filters.status) : undefined,
    origin: request.filters.origin ? Number(request.filters.origin) : undefined,
  });

  return {
    items: response.data.leads,
    total: response.data.page.count,
    page: response.data.page.current_page,
    pageSize: response.data.page.limit,
  };
}
