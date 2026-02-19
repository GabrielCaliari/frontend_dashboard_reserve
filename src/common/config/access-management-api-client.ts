/**
 * Access Management API Client
 * 
 * Axios instance configured specifically for access management endpoints.
 * Base URL: Uses NEXT_PUBLIC_API_URL environment variable
 * Authentication: Bearer token from cookies
 */

import axios, { AxiosError } from 'axios';
import { handleUnauthorizedError, isUnauthorizedError } from '@/src/common/utils/auth-error-handler';

const ACCESS_MANAGEMENT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zarpstudio.com';

/**
 * Axios instance for access management API calls
 */
export const accessManagementApiClient = axios.create({
  baseURL: ACCESS_MANAGEMENT_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

/**
 * Request interceptor - Adds authentication headers
 */
accessManagementApiClient.interceptors.request.use(
  (config) => {
    // Add Bearer token from cookies
    if (typeof window !== 'undefined') {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add session ID if available
      const sessionId = document.cookie
        .split('; ')
        .find(row => row.startsWith('session-code='))
        ?.split('=')[1];

      if (sessionId) {
        config.headers['session-id'] = sessionId;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handles authentication errors
 */
accessManagementApiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 Unauthorized errors
    if (isUnauthorizedError(error)) {
      handleUnauthorizedError();
    }
    
    return Promise.reject(error);
  }
);

export default accessManagementApiClient;
