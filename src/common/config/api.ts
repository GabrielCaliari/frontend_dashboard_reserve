import axios from "axios";
import { handleUnauthorizedError, isUnauthorizedError } from "@/src/common/utils/auth-error-handler";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Adiciona headers de autenticação e tenant
api.interceptors.request.use(
  (config) => {
    // Recuperar token e session_id dos cookies
    if (typeof window !== 'undefined') {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      const sessionId = document.cookie
        .split('; ')
        .find(row => row.startsWith('session-code='))
        ?.split('=')[1];

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (sessionId) {
        config.headers['session-id'] = sessionId;
      }

      // Adicionar x-tenant-id do localStorage (Zustand persist)
      try {
        const tenantStorage = localStorage.getItem('tenant-storage');
        if (tenantStorage) {
          const { state } = JSON.parse(tenantStorage);
          if (state?.selectedTenant?.id) {
            config.headers['x-tenant-id'] = state.selectedTenant.id.toString();
          }
        }
      } catch (error) {
        console.warn('Failed to read tenant from storage:', error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Trata erros de autenticação (ONLY for api.ts)
// This is the ONLY place where 401 errors trigger automatic redirect
// Other API clients (cms-api-client, api-email) should let errors propagate
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isUnauthorizedError(error)) {
      handleUnauthorizedError();
    }
    return Promise.reject(error);
  }
);

export default api;
export { api as apiClient };
