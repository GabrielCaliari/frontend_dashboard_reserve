import { ICreatePrimaryCopy } from "../../@types/@email-builder";
import apiEmail from "../../config/api-email";
import { errorTypes } from "../../config/error-types";

export default async function createPrimaryCopyService(id: string, data: ICreatePrimaryCopy) {
    try {
        const response = await apiEmail.post(`/email-campaign/primary-copy-variant/create/${id}`, data);

        return response.data;
    } catch (error: any) {
        if (error.response && error.response.data.code) {
            let message = '';

            switch (error.response.data.code) {
                case errorTypes._404.email_campaign_not_found:
                    message = 'Campanha não encontrada.';
                    break;
                case errorTypes._500.create_primary_copy_variant:
                    message = 'Não foi possível criar uma nova variante de copy primária.';
                    break;
                default:
                    message = 'Erro ao criar copy primária.';
                    break;
            }

            return {
                error: true,
                message: message,
            }
        }

        return {
            error: true,
            message: 'Erro ao criar copy primária.',
        }
    }
}
