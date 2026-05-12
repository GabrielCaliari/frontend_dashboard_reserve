import { useQuery } from "@tanstack/react-query";
import { blogService } from "@/src/modules/cms/infrastructure/adapters";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

export function useGetBlog(blogId: number) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ["blog", tenantId, blogId],
    queryFn: () => blogService.getBlog(blogId),
    enabled: !!blogId && !!tenantId,
  });
}
