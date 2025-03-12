import toast from "react-hot-toast";
import { completeScreening } from "../actions/complete-screening";

export default function useCompleteScreening() {
    const execCompleteScreening = async (leadId: string) => {
        const promise = completeScreening(leadId);

        return promise
            .then(async result => {
                if (result) {
                    toast.success('O processo de triagem do Lead foi fechado com sucesso.');
                    return true;
                }

                throw 'Não foi possível fechar o processo de triagem do lead';
            }).catch(async result => {
                toast.error('Ops... Deu erro ao concluir o processo de triagem do lead.');
                return false;
            });
    }

    return { execCompleteScreening };
}