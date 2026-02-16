import { LoginCredentials, AuthResponse } from "@/src/common/@types/@auth";
import api from "../config/api";
import { errorTypes } from "../config/error-types";

export async function adminLoginService({ email, password }: LoginCredentials) {
    try {
        // Endpoint: /admin/authenticate
        const response = await api.post<AuthResponse>(`/admin/authenticate`, {
            email,
            password
        });

        return response.data;
    } catch (error: any) {
        if (error?.response?.data?.code) {
            return error.response.data.code;
        }

        return errorTypes._500.admin_una;
    }
}