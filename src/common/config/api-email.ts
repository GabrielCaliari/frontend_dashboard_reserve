import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_EMAIL_URL;

const apiEmail = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Adiciona headers de autenticação e tenant
apiEmail.interceptors.request.use(
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
