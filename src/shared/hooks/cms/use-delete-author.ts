import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAuthor } from "@/src/modules/cms/infrastructure/adapters";
import { useSelectedTenantId } from "@/src/shared/stores/tenant-store";
import { AUTHOR_QUERY_KEYS } from "./use-get-authors";

export function useDeleteAuthor() {
  const queryClient = useQueryClient();
  const tenantId = useSelectedTenantId();

  return useMutation({
    mutationFn: (authorId: string) => deleteAuthor(authorId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: AUTHOR_QUERY_KEYS.all(tenantId),
      });
    },
  });
}
