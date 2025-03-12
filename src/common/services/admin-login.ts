import { IAuthenticateAdmin } from "@/src/interfaces/admin.interface";
import api from "../config/api";
import { errorTypes } from "../config/error-types";

export async function adminLoginService({ email, password }: IAuthenticateAdmin) {
    try {
        const response = await api.post(`/admin/authenticate`, {
            email,
            password
        });

        return response.data;
    } catch (error: any) {
        if (error.response.data.code) {
            return error.response.data.code;
        }

        return errorTypes._500.admin_una;
    }
}