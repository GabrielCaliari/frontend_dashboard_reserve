import axios from "axios";
import {
  handleUnauthorizedError,
  isUnauthorizedError,
} from "@/src/common/utils/auth-error-handler";
import { buildApiBaseUrl } from "./build-api-base-url";
import { injectAuthHeaders } from "./get-auth-headers";

// In browser (client-side), only NEXT_PUBLIC_ variables are available
const API_URL =
  typeof window !== "undefined"
    ? process.env.NODE_ENV === "development"
      ? (process.env.NEXT_PUBLIC_LOCAL_API_URL ?? "http://localhost:3002")
      : (process.env.NEXT_PUBLIC_RESERVE_API_URL ??
        process.env.NEXT_PUBLIC_API_URL)
    : process.env.NODE_ENV === "development"
      ? (process.env.NEXT_PUBLIC_LOCAL_API_URL ??
        process.env.NEXT_LOCAL_API_URL)
      : (process.env.NEXT_PUBLIC_RESERVE_API_URL ??
        process.env.NEXT_PUBLIC_API_URL);

const api = axios.create({
  baseURL: buildApiBaseUrl(API_URL),
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - Adiciona headers de autenticação e tenant (client + server)
api.interceptors.request.use(
  async (config) => {
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    // Check skip flag BEFORE injecting (axios preserves headers object)
    const skipTenant = config.headers["x-skip-tenant"] === "true";
    delete config.headers["x-skip-tenant"];

    const result = await injectAuthHeaders(config);

    if (skipTenant) {
      delete result.headers["x-tenant-id"];
    }

    return result;
  },
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
  },
);

export default api;
export { api as apiClient };

// CMS API Client - Dedicated client for CMS endpoints
const cmsApi = axios.create({
  baseURL: buildApiBaseUrl(API_URL),
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for CMS API - Same auth logic via shared helper
cmsApi.interceptors.request.use(
  async (config) => {
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return injectAuthHeaders(config);
  },
  (error) => Promise.reject(error),
);

// Response interceptor for CMS API - Let errors propagate without redirect
cmsApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 for CMS API - let the caller handle it
    return Promise.reject(error);
  },
);

export { cmsApi as cmsApiClient };
