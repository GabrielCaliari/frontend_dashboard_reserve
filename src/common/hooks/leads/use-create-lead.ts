import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLeadAction } from "@/src/common/actions/leads/create-lead";
import type {
  CreateLeadDto,
  LeadDetailResponse,
} from "@/src/shared/domain/types/@lead";
import { toast } from "react-hot-toast";

export function useCreateLead() {
  const queryClient = useQueryClient();

  return useMutation<LeadDetailResponse, Error, CreateLeadDto>({
    mutationFn: createLeadAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leads", "list"] });
      toast.success("Lead created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create lead");
    },
  });
}
