import api from "../config/api";

export const brandAnalyticsService = async (token: string, session: string) => {
    try {
        const response = await api.get("/brand-analysis", {
            headers: {
                Authorization: `Bearer ${token}`,
                'session-id': session,
            },
        });

        return response.data;
    } catch (error) {
        console.error("Erro os relatórios de análise de marca:", error);
        throw error;
    }
}