import { AdminProfile } from "@/src/common/@types/@auth";
import api from "../config/api";
import { errorTypes } from "../config/error-types";

export async function getAdminProfileService(): Promise<AdminProfile | string> {
    try {
        const response = await api.get<AdminProfile>(`/admin/me`);
        return response.data;
    } catch (error: any) {
        if (error?.response?.data?.code) {
            return error.response.data.code;
        }
        return errorTypes._500.admin_una;
    }
}
