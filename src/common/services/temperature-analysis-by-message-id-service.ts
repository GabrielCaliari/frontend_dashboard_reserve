import api from "../config/api";
import { errorTypes } from "../config/error-types";

export const temperatureAnalysisByMessageIdService = async ({
    message_id
}: { message_id: string }) => {
    try {
        const response = await api.post(`/auth/leads/temperature-analysis/${message_id}`);

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