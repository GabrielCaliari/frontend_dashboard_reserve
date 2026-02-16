import { Tenant } from "@/src/common/@types/@auth";
import api from "../config/api";
import { errorTypes } from "../config/error-types";

export async function listMyTenantsService(): Promise<Tenant[] | string> {
    try {
        const response = await api.get<Tenant[]>(`/auth/tenants/my-tenants`);
        return response.data;
    } catch (error: any) {
        if (error?.response?.data?.code) {
            return error.response.data.code;
        }
        return errorTypes._500.admin_una;
    }
}
