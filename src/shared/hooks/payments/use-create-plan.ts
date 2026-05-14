import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPlanAction } from "@/src/presentation/actions/payments/create-plan";
import type { CreateStripePlanDto } from "@/src/shared/domain/types/@payments";

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
