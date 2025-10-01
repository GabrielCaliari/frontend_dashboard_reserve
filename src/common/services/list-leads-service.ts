import api from "../config/api";
import { errorTypes } from "../config/error-types";

export const listLeadsService = async ({ 
    token, 
    session, 
    page = 1 
}: { 
    token: string, 
    session: string,
    page?: number
}) => {
    try {
        const response = await api.get('v2/lead', {
            headers: {
                Authorization: `Bearer ${token}`,
                'session-id': session,
            },
            params: {
                page
            }
        });

        if (response.status !== 200) {
            throw response.data;
        }

        return response.data;
    } catch (error: any) {
        if (error.response.data.code) {
            return error.response.data.code;
        }

        return errorTypes._500.list_leads;
    }
}