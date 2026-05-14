import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { completeScreening } from "@/src/presentation/actions/complete-screening";

export default function useCompleteScreening() {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (leadId: string) => completeScreening(leadId),
    onSuccess: (result) => {
      if (result) {
        toast.success("O processo de triagem do Lead foi fechado com sucesso.");
      } else {
        toast.error(
          "Ops... Deu erro ao concluir o processo de triagem do lead.",
        );
      }
    },
    onError: () => {
      toast.error("Ops... Deu erro ao concluir o processo de triagem do lead.");
    },
  });

  const execCompleteScreening = async (leadId: string): Promise<boolean> => {
    try {
      const result = await mutateAsync(leadId);
      return !!result;
    } catch {
      return false;
    }
  };

  return { execCompleteScreening, isPending };
}
