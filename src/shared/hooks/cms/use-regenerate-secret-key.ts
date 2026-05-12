import { useMutation, useQueryClient } from "@tanstack/react-query";
import { blogService } from "@/src/modules/cms/infrastructure/adapters";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";

export function useRegenerateSecretKey() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (blogId: number) => blogService.regenerateSecretKey(blogId),
    onSuccess: (_, blogId) => {
      queryClient.invalidateQueries({ queryKey: ["blog", tenantId, blogId] });
    },
  });
}
