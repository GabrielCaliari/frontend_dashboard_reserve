import { useMutation, useQueryClient } from '@tanstack/react-query';
import { blogService } from '@/src/common/services/blog-service';
import type { BlogCreateInput } from '@/src/common/@types/@blog';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';

export function useCreateBlog() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (data: BlogCreateInput) => blogService.createBlog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs', tenantId] });
    },
  });
}
