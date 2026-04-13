import { Tenant } from "@/src/shared/domain/types/@auth";
import api from "../../infraestructure/axios/api";
import { errorTypes } from "../../infraestructure/axios/error-types";

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
