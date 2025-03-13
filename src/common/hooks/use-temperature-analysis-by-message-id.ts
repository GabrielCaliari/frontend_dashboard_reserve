import toast from "react-hot-toast";
import { temperatureAnalysisByMessageId } from "../actions/temperature-analysis-by-message-id";

export default function useTemperatureAnalysisByMessageId() {
    const execTemperatureAnalysisByMessageId = async (messageId: string) => {
        const promise = temperatureAnalysisByMessageId(messageId);

        return promise
            .then(async result => {
                if (result == true) {
                    toast.success('Temperatura processada com sucesso.');
                    return true;
                }

                throw 'Não foi possível processar a temperatura do lead.';
            }).catch(async result => {
                toast.error('Ops... Deu erro ao concluir o processo de temperatura do lead.');
                return false;
            });
    }

    return { execTemperatureAnalysisByMessageId }
}