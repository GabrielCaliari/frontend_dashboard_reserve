import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createAuthor, CreateAuthorDto } from '@/src/common/services/cms-author-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';
import { AUTHOR_QUERY_KEYS } from './use-get-authors';
import type { Author } from '@/src/common/@types/@cms-author';

export function useCreateAuthor() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (data: CreateAuthorDto) => createAuthor(data),
    onSuccess: (newAuthor) => {
      // Append to list cache directly — preserves avatar URL from the
      // creation response without triggering a lossy refetch.
      queryClient.setQueryData(
        AUTHOR_QUERY_KEYS.all(tenantId),
        (old: Author[] | undefined) => (old ? [...old, newAuthor] : [newAuthor]),
      );
    },
  });
}
