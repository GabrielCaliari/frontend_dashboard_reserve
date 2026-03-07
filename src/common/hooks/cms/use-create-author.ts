import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAuthor, CreateAuthorDto } from '@/src/common/services/cms-author-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';
import { AUTHOR_QUERY_KEYS } from './use-get-authors';

export function useCreateAuthor() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (data: CreateAuthorDto) => createAuthor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTHOR_QUERY_KEYS.all(tenantId) });
    },
  });
}
