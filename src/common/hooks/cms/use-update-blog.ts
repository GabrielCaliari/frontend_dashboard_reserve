import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blogService } from "@/src/common/services/blog-service";
import type { BlogUpdateInput } from "@/src/shared/domain/types/@blog";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

export function useUpdateBlog(blogId: number) {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (data: BlogUpdateInput) => blogService.updateBlog(blogId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs", tenantId] });
      queryClient.invalidateQueries({ queryKey: ["blog", tenantId, blogId] });
    },
  });
}
