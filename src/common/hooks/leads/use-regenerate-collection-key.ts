import { useMutation, useQueryClient } from "@tanstack/react-query";
import { regenerateCollectionKeyAction } from "@/src/common/actions/leads/regenerate-collection-key";
import type { RegenerateKeyResponse } from "@/src/shared/domain/types/@lead";
import { toast } from "react-hot-toast";

export function useRegenerateCollectionKey() {
  const queryClient = useQueryClient();

  return useMutation<RegenerateKeyResponse, Error, number>({
    mutationFn: (id) => regenerateCollectionKeyAction(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: ["lead-collections", "detail", id],
      });
      toast.success("Secret key regenerated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to regenerate secret key");
    },
  });
}
