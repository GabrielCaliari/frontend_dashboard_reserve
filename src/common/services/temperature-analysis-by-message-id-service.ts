import api from "../config/api";
import { errorTypes } from "../config/error-types";

export const temperatureAnalysisByMessageIdService = async ({
    session,
    token,
    message_id
}: { session: string, token: string, message_id: string }) => {
    try {
        const response = await api.post(`/admin/lead/temperature-analysis/lead-qualification/${message_id}`, null, {
            headers: {
                Authorization: `Bearer ${token}`,
                'session-id': session,
            }
        });

        if (response.status !== 200) {
            throw response.data;
        }

        return true;
    } catch (error: any) {
        if (error.response.data.code) {
            return error.response.data.code;
        }

        return errorTypes._500.temperature_analysis_by_message;
    }
}