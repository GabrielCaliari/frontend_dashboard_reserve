import axios from "axios";
import { handleUnauthorizedError, isUnauthorizedError } from "@/src/common/utils/auth-error-handler";
import { injectAuthHeaders } from "./get-auth-headers";

// In browser (client-side), only NEXT_PUBLIC_ variables are available
// For server-side, we can use NEXT_LOCAL_API_URL
const API_URL = typeof window !== 'undefined'
  ? (process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3002'  // Hardcoded for client-side dev
      : process.env.NEXT_PUBLIC_API_URL)
  : (process.env.NODE_ENV === 'development'
      ? process.env.NEXT_LOCAL_API_URL
      : process.env.NEXT_PUBLIC_API_URL);

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Adiciona headers de autenticação e tenant (client + server)
api.interceptors.request.use(
  (config) => injectAuthHeaders(config),
  (error) => Promise.reject(error),
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

// CMS API Client - Dedicated client for CMS endpoints
const cmsApi = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for CMS API - Same auth logic via shared helper
cmsApi.interceptors.request.use(
  (config) => injectAuthHeaders(config),
  (error) => Promise.reject(error),
);

// Response interceptor for CMS API - Let errors propagate without redirect
cmsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 for CMS API - let the caller handle it
    return Promise.reject(error);
  }
);

export { cmsApi as cmsApiClient };
