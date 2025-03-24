import toast from "react-hot-toast";
import { listLeads } from "../actions/list-leads";

export default function useListLeads() {
    const execListLeads = async (page: number = 1) => {
        const promise = listLeads(page);

        return promise
            .then(async result => {
                if (result && result.raws) {
                    return result;
                }

                throw new Error('Ops... Deu erro ao listar os leads.');
            })
            .catch(async result => {
                toast.error('Ops... Deu erro ao listar os leads.');
                return [];
            });

    }

    return { execListLeads }
}
