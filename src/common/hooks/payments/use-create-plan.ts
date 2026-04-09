import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPlanAction } from "@/src/common/actions/payments/create-plan";
import type { CreateStripePlanDto } from "@/src/common/@types/@payments";

type CreatePlanInput = Omit<CreateStripePlanDto, "tenant_id">;

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePlanInput) => createPlanAction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans-admin"] });
    },
  });
}
