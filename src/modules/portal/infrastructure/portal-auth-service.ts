import api from "@/src/infraestructure/axios/api";
import type {
  ClientAuthResponse,
  ClientLoginCredentials,
} from "@/src/modules/portal/domain/portal-auth";

export const portalAuthService = {
  async login(credentials: ClientLoginCredentials): Promise<ClientAuthResponse> {
    const response = await api.post<ClientAuthResponse>("/portal/auth/login", credentials);
    return response.data;
  },
};
