import { updateLeadQualification } from "../actions/update-lead-qualification";

export default function useUpdateLeadQualification() {
    const execUpdateLeadQualification = async ({
        lead_id,
        card
    }: {
        lead_id: string,
        card: string
    }) => {
        return updateLeadQualification(lead_id, card)
            .then((result) => {
                console.log(result)
                return result;
            })
            .catch((result) => {
                console.log(result);
                return result;
            });
    }

    return { execUpdateLeadQualification };
}