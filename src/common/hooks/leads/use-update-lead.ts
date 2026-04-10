import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateLeadAction } from "@/src/common/actions/leads/update-lead";
import type {
  UpdateLeadDto,
  LeadDetailResponse,
} from "@/src/shared/domain/types/@lead";
import { toast } from "react-hot-toast";

interface UpdateLeadParams {
  id: string;
  data: UpdateLeadDto;
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation<LeadDetailResponse, Error, UpdateLeadParams>({
    mutationFn: ({ id, data }) => updateLeadAction(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["leads", "list"] });
      queryClient.invalidateQueries({
        queryKey: ["leads", "detail", variables.id],
      });
      toast.success("Lead updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update lead");
    },
  });
}
