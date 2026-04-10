import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCollectionAction } from "@/src/common/actions/leads/update-collection";
import type {
  UpdateCollectionDto,
  CollectionDetailResponse,
} from "@/src/shared/domain/types/@lead";
import { toast } from "react-hot-toast";

interface UpdateCollectionParams {
  id: string;
  data: UpdateCollectionDto;
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();

  return useMutation<CollectionDetailResponse, Error, UpdateCollectionParams>({
    mutationFn: ({ id, data }) => updateCollectionAction(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["lead-collections", "list"] });
      queryClient.invalidateQueries({
        queryKey: ["lead-collections", "detail", variables.id],
      });

      // Show secret key if access mode changed to restricted
      if (data.data.secret_key) {
        toast.success(
          `Collection updated! New secret key: ${data.data.secret_key} (save this, it won't be shown again)`,
          { duration: 10000 },
        );
      } else {
        toast.success("Collection updated successfully");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update collection");
    },
  });
}
