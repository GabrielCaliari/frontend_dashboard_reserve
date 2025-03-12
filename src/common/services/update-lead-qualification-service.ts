import api from "../config/api";
import { errorTypes } from "../config/error-types";

export const updateLeadQualificationService = async ({
    session,
    token,
    lead_id,
    card
}: { session: string, token: string, lead_id: string, card: string }) => {
    try {
        const response = await api.post(`admin/lead/update/trademark-registration/${lead_id}`, {
            card
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
                'session-id': session,
            }
        });

        return response.data;
    } catch (error: any) {
        if (error.response.data.code) {
            return error.response.data.code;
        }

        return errorTypes._500.update_lead;
    }
}