import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/modules/hotel-portal/infrastructure/adapters';
import type {
  CreateWhatsAppLinkDto,
  UpdateWhatsAppLinkDto,
} from '@/src/shared/domain/types/@hotel-portal';

const QK = (clientId: string) => ['hotel-portal', 'whatsapp-links', clientId];

export function useWhatsAppLinks(clientId: string | null) {
  return useQuery({
    queryKey: QK(clientId!),
    queryFn: () => hotelPortalService.listWhatsAppLinks(clientId!),
    enabled: !!clientId,
  });
}

export function useWhatsAppLinkStats(clientId: string | null, id: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'whatsapp-links', clientId, id, 'stats'],
    queryFn: () => hotelPortalService.getWhatsAppLinkStats(clientId!, id!),
    enabled: !!clientId && !!id,
  });
}

export function useCreateWhatsAppLink(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWhatsAppLinkDto) =>
      hotelPortalService.createWhatsAppLink(clientId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK(clientId) }),
  });
}

export function useUpdateWhatsAppLink(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWhatsAppLinkDto }) =>
      hotelPortalService.updateWhatsAppLink(clientId, id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK(clientId) }),
  });
}

export function useDeleteWhatsAppLink(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => hotelPortalService.deleteWhatsAppLink(clientId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK(clientId) }),
  });
}
