import apiEmail from "../../config/api-email";

export const closeSetupService = async (campaignId: string) => {
    try {
        const response = await apiEmail.post(`/email-campaign/close-setup/${campaignId}`);
        
        return {
            id: response.data.id,
        };
    } catch (err: any) {
        if (err.response && err.response.data.code) {
            let message = '';

            switch (err.response.data.code) {
                default:
                    message = 'Erro ao fechar setup da campanha.';
                    break;
            }

            return {
                error: true,
                message: message,
            };
        }

        return {
            error: true,
            message: 'Erro ao fechar setup da campanha.',
        };
    }
}