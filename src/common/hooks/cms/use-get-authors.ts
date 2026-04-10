import { useQuery } from "@tanstack/react-query";
import { fetchAuthors } from "@/src/common/services/cms-author-service";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

export const AUTHOR_QUERY_KEYS = {
  all: (tenantId: string | null) => ["authors", tenantId] as const,
};

export function useGetAuthors() {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: AUTHOR_QUERY_KEYS.all(tenantId),
    queryFn: () => fetchAuthors(),
    enabled: !!tenantId,
    retry: 2,
    staleTime: 60 * 1000,
  });
}
