import apiEmail from "../../config/api-email";
import { errorTypes } from "../../config/error-types";

export default async function listSmtpServersServices() {
    try {
        const response = await apiEmail.get("/smtp-server");
        return response.data;
    } catch(err: any) {
        if (err.response && err.response.data.code) {
            let message = '';

            switch (err.response.data.code) {
                case errorTypes._500.get_smtp_servers:
                default:
                    message = 'Houve um erro ao listar os servidores SMTP.';
                    break;
            }

            return {
                error: true,
                message: message,
            };
        }

        return {
            error: true,
            message: 'Erro ao listar os servidores SMTP.',
        };
    }
}
