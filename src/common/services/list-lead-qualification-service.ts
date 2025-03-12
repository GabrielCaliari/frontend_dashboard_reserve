import api from "../config/api";
import { errorTypes } from "../config/error-types";

export const listLeadQualificationService = async ({
    session,
    token
}: { session: string, token: string }) => {
    try {
        const response = await api.get(`admin/lead/list/trademark-registration`, {
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

        return errorTypes._500.list_trademark_registration_leads;
    }
}