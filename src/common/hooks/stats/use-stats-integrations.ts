import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { statsService } from '@/src/common/services/stats-service';
import { useSelectedTenantId } from '@/src/common/stores/tenant-store';
import type {
  CreateStatsIntegrationDto,
  UpdateStatsIntegrationDto,
} from '@/src/common/@types/@stats';
import toast from 'react-hot-toast';

export function useStatsIntegrations() {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['stats-integrations', tenantId],
    queryFn: () => statsService.listIntegrations(),
    enabled: !!tenantId,
  });
}

export function useStatsProviders() {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['stats-providers', tenantId],
    queryFn: () => statsService.getProviders(),
    enabled: !!tenantId,
  });
}

export function useStatsIntegration(id: string | null) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['stats-integration', tenantId, id],
    queryFn: () => statsService.getIntegration(id!),
    enabled: !!tenantId && !!id,
  });
}

export function useCreateStatsIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStatsIntegrationDto) =>
      statsService.createIntegration(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['stats-dashboard'] });
      toast.success('Integração criada com sucesso');
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      if (status === 409) {
        toast.error('Esta integração já está configurada para este tenant');
      } else {
        toast.error('Erro ao criar integração');
      }
    },
  });
}

export function useUpdateStatsIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStatsIntegrationDto }) =>
      statsService.updateIntegration(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['stats-dashboard'] });
      toast.success('Integração atualizada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar integração');
    },
  });
}

export function useDeleteStatsIntegration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => statsService.deleteIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stats-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['stats-dashboard'] });
      toast.success('Integração removida');
    },
    onError: () => {
      toast.error('Erro ao remover integração');
    },
  });
}
