import axios from "axios";
import { buildApiBaseUrl } from "./build-api-base-url";
import { injectAuthHeaders } from "./get-auth-headers";

const API_URL = process.env.NEXT_PUBLIC_RESERVE_API_EMAIL_URL ?? process.env.NEXT_PUBLIC_API_EMAIL_URL;

const apiEmail = axios.create({
  baseURL: buildApiBaseUrl(API_URL),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Adiciona headers de autenticação e tenant (client + server)
apiEmail.interceptors.request.use(
  (config) => injectAuthHeaders(config),
  (error) => Promise.reject(error),
);

// Response interceptor - Let errors propagate to caller
// Auth errors (401) should be handled by the service layer or global error handler
// This prevents premature redirects when the error might be recoverable
apiEmail.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't auto-redirect on 401 - let the service layer handle it
    // This allows for better error messages and prevents redirect loops
    return Promise.reject(error);
  }
);

export default apiEmail;
