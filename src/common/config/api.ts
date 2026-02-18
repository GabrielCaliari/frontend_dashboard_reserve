import axios from "axios";

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

// Response interceptor - Trata erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Limpar cookies e redirecionar para login
      if (typeof window !== 'undefined') {
        document.cookie = 'token=; Max-Age=0; path=/;';
        document.cookie = 'session-code=; Max-Age=0; path=/;';
        document.cookie = 'session-name=; Max-Age=0; path=/;';
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
