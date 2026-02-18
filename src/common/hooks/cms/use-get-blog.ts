import { useQuery } from '@tanstack/react-query';
import { blogService } from '@/src/common/services/blog-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export function useGetBlog(blogId: number) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['blog', tenantId, blogId],
    queryFn: () => blogService.getBlog(blogId),
    enabled: !!blogId && !!tenantId,
  });
}
