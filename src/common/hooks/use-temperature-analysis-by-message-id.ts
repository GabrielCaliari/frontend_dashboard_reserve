import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { temperatureAnalysisByMessageId } from "../actions/temperature-analysis-by-message-id";

export default function useTemperatureAnalysisByMessageId() {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: (messageId: string) => temperatureAnalysisByMessageId(messageId),
    onSuccess: (result) => {
      if (result === true) {
        toast.success("Temperatura processada com sucesso.");
      } else {
        toast.error("Ops... Deu erro ao concluir o processo de temperatura do lead.");
      }
    },
    onError: () => {
      toast.error("Ops... Deu erro ao concluir o processo de temperatura do lead.");
    },
  });

  const execTemperatureAnalysisByMessageId = async (messageId: string): Promise<boolean> => {
    try {
      const result = await mutateAsync(messageId);
      return result === true;
    } catch {
      return false;
    }
  };

  return { execTemperatureAnalysisByMessageId, isPending };
}
