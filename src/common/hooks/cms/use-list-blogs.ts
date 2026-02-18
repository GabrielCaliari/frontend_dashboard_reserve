import { useQuery } from '@tanstack/react-query';
import { blogService } from '@/src/common/services/blog-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export function useListBlogs(page = 1, limit = 10) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['blogs', tenantId, page, limit],
    queryFn: () => blogService.listBlogs(page, limit),
    enabled: !!tenantId,
  });
}
