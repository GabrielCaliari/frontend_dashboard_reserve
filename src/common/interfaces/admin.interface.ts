// DEPRECATED: Use LoginCredentials from @/src/common/types/@auth
// Mantido para compatibilidade com código legado
export interface IAuthenticateAdmin {
    email: string;
    password: string;
}

// Re-export dos novos tipos para facilitar migração gradual
export type { LoginCredentials, AuthResponse, AdminProfile, Tenant } from '@/src/common/@types/@auth';
export { AdminRole } from '@/src/common/@types/@auth';