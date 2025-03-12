import api from "../config/api";
import { errorTypes } from "../config/error-types";

export const completeScreeningService = async ({
    session,
    token,
    lead_id,
}: { token: string, session: string, lead_id: string }) => {
    try {
        const response = await api.post(`admin/lead/update/lead-qualification/screening-complete/${lead_id}`, null, {
            headers: {
                Authorization: `Bearer ${token}`,
                'session-id': session,
            }
        });

        if (response.status === 200) {
            return true;
        }

        return false;
    } catch (error: any) {
        if (error.response.data.code) {
            return error.response.data.code;
        }

        return false;
    }
}