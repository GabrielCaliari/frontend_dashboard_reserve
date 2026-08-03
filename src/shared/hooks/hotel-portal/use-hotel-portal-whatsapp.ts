import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/modules/hotel-portal/infrastructure/adapters';
import type { CreateWhatsAppTemplateDto, SendWhatsAppDto } from '@/src/shared/domain/types/@hotel-portal';

export function useWhatsAppTemplates(clientId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'whatsapp', 'templates', clientId],
    queryFn: () => hotelPortalService.listWhatsAppTemplates(clientId!),
    enabled: !!clientId,
  });
}

export function useWhatsAppMessages(clientId: string | null, params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: ['hotel-portal', 'whatsapp', 'messages', clientId, params],
    queryFn: () => hotelPortalService.listWhatsAppMessages(clientId!, params),
    enabled: !!clientId,
  });
}

export function useCreateWhatsAppTemplate(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWhatsAppTemplateDto) =>
      hotelPortalService.createWhatsAppTemplate(clientId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'whatsapp', 'templates', clientId] }),
  });
}

export function useSendWhatsApp(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SendWhatsAppDto) => hotelPortalService.sendWhatsApp(clientId, data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'whatsapp', 'messages', clientId] }),
  });
}
