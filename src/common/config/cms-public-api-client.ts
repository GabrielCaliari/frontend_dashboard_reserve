import axios, { AxiosInstance } from 'axios';

const CMS_API_URL = process.env.NODE_ENV === 'development' 
  ? process.env.NEXT_LOCAL_API_URL 
  : process.env.NEXT_PUBLIC_API_URL;

/**
 * Factory function to create a configured axios instance for CMS public API endpoints.
 * The public API uses blog secret keys for authentication instead of JWT tokens.
 * 
 * @param blogSecretKey - The secret key associated with a specific blog
 * @returns Configured axios instance with public API base URL and authentication header
 * 
 * @example
 * const client = createPublicCmsClient('your-blog-secret-key');
 * const response = await client.get('/articles');
 */
export const createPublicCmsClient = (blogSecretKey: string): AxiosInstance => {
  const client = axios.create({
    baseURL: `${CMS_API_URL}/api/cms/public`,
    headers: {
      'Content-Type': 'application/json',
      'x-blog-secret-key': blogSecretKey,
    },
  });

  // Response interceptor - Prevent global 401 redirect for public API
  // Public API uses blog secret keys, not JWT tokens, so 401 should be handled by the caller
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      // Don't redirect on 401 - just reject the promise
      // The caller (cms-public-service) will handle the error appropriately
      return Promise.reject(error);
    }
  );

  return client;
};
