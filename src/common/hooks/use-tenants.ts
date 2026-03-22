'use client'

import { useQuery } from '@tanstack/react-query';
import { listMyTenantsService } from '../services/tenant';
import type { Tenant } from '@/src/common/@types/@auth';

export default function useTenants() {
  const { data, isLoading, error, refetch } = useQuery<Tenant[] | string>({
    queryKey: ['my-tenants'],
    queryFn: listMyTenantsService,
    staleTime: 5 * 60 * 1000,
  });

  const tenants = Array.isArray(data) ? data : [];
  const queryError = typeof data === 'string' ? data : error ? String(error) : null;

  return {
    tenants,
    loading: isLoading,
    error: queryError,
    refetch,
  };
}
