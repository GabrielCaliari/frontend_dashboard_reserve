import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateAuthor, UpdateAuthorDto } from '@/src/common/services/cms-author-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';
import { AUTHOR_QUERY_KEYS } from './use-get-authors';

export function useUpdateAuthor() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: ({ authorId, data }: { authorId: string; data: UpdateAuthorDto }) =>
      updateAuthor(authorId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTHOR_QUERY_KEYS.all(tenantId) });
    },
  });
}
