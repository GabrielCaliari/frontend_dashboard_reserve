import { useMutation } from "@tanstack/react-query";
import { updateLeadQualification } from "@/src/presentation/actions/update-lead-qualification";

export default function useUpdateLeadQualification() {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: ({ lead_id, card }: { lead_id: string; card: string }) =>
      updateLeadQualification(lead_id, card),
  });

  const execUpdateLeadQualification = async ({
    lead_id,
    card,
  }: {
    lead_id: string;
    card: string;
  }) => {
    try {
      return await mutateAsync({ lead_id, card });
    } catch (error) {
      return error;
    }
  };

  return { execUpdateLeadQualification, isPending };
}
