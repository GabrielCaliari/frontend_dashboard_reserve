import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blogService } from "@/src/common/services/blog-service";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

export function useDeleteBlog() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (blogId: number) => blogService.deleteBlog(blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blogs", tenantId] });
    },
  });
}
