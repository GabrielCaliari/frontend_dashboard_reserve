'use client'

import useAdminDetails from './useUserDatails';
import type { AdminProfile } from '@/src/common/@types/@auth';

export default function useAdminProfile() {
  const { data, isLoading, error, refetch } = useAdminDetails();

  return {
    profile: (data as AdminProfile | undefined) ?? null,
    loading: isLoading,
    error: error ? (error as Error).message ?? 'Erro ao carregar perfil' : null,
    refetch,
  };
}
