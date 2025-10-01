import apiEmail from "../../config/api-email";
import { errorTypes } from "../../config/error-types";

export const uploadLeadsService = async (campaignId: string, file: File) => {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("campaignId", campaignId);

        const response = await apiEmail.post(`/email-campaign/upload-leads/${campaignId}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    } catch (err: any) {
        console.log(err)
        if (err.response && err.response.data.code) {
            let message = '';
            switch (err.response.data.code) {
                default:
                    message = 'Erro ao fazer upload dos leads.';
                    break;
            }
            return {
                error: true,
                message: message,
            };
        }
        return {
            error: true,
            message: 'Erro ao fazer upload dos leads.',
        };
    }
} 