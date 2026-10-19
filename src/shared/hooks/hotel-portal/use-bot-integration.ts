import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/modules/hotel-portal/infrastructure/adapters';

/**
 * Configuracao da integracao do bot por tenant (admin). Os segredos devolvidos
 * pelas mutations (tenant_key, panel_webhook_secret, webhook_secret) sao
 * mostrados uma unica vez pelo componente e nao sao guardados em nenhuma query.
 */
const key = (tenantId: string | null) => ['hotel-portal', 'bot-integration', tenantId] as const;

export function useBotIntegrationConfig(tenantId: string | null) {
  return useQuery({
    queryKey: key(tenantId),
    queryFn: () => hotelPortalService.getBotIntegrationConfig(tenantId!),
    enabled: !!tenantId,
    retry: false,
    staleTime: 60_000,
  });
}

export interface SaveBotIntegrationInput {
  exists: boolean;
  data: { bot_tenant_ref?: string; n8n_panel_webhook_url?: string; n8n_motor_webhook_url?: string };
}

export function useSaveBotIntegration(tenantId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    // O resultado carrega um segredo exibido uma unica vez: nao fica no MutationCache.
    gcTime: 0,
    mutationFn: ({ exists, data }: SaveBotIntegrationInput) =>
      exists
        ? hotelPortalService.updateBotIntegrationConfig(tenantId!, data)
        : hotelPortalService.createBotIntegrationConfig(tenantId!, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(tenantId) }),
  });
}

export function useRegenerateBotTenantKey(tenantId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    // O resultado carrega um segredo exibido uma unica vez: nao fica no MutationCache.
    gcTime: 0,
    mutationFn: () => hotelPortalService.regenerateBotTenantKey(tenantId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(tenantId) }),
  });
}

export function useRegenerateBotPanelSecret(tenantId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    // O resultado carrega um segredo exibido uma unica vez: nao fica no MutationCache.
    gcTime: 0,
    mutationFn: () => hotelPortalService.regenerateBotPanelSecret(tenantId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(tenantId) }),
  });
}

export function useSetBotIntegrationActive(tenantId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (active: boolean) => hotelPortalService.setBotIntegrationActive(tenantId!, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(tenantId) }),
  });
}

/** O segredo do canal C vive no cliente; invalida a integracao e o cliente (webhook_secret_set). */
export function useRegenerateClientWebhookSecret(clientId: string, tenantId: string | null = null) {
  const qc = useQueryClient();
  return useMutation({
    // O resultado carrega um segredo exibido uma unica vez: nao fica no MutationCache.
    gcTime: 0,
    mutationFn: () => hotelPortalService.regenerateClientWebhookSecret(clientId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(tenantId) });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'clients', clientId] });
    },
  });
}
