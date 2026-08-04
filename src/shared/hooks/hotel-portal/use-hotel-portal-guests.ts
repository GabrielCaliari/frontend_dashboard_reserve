import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/modules/hotel-portal/infrastructure/adapters';
import type { CreateGuestDto, AddGuestStayDto } from '@/src/shared/domain/types/@hotel-portal';

export function useGuests(clientId: string | null, params?: { search?: string; tag?: string }) {
  return useQuery({
    queryKey: ['hotel-portal', 'guests', clientId, params],
    queryFn: () => hotelPortalService.listGuests(clientId!, params),
    enabled: !!clientId,
  });
}

export function useReactivationList(clientId: string | null, params?: { days?: number }) {
  return useQuery({
    queryKey: ['hotel-portal', 'guests', 'reactivation', clientId, params],
    queryFn: () => hotelPortalService.getReactivationList(clientId!, params),
    enabled: !!clientId,
  });
}

export function useGuest(guestId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'guests', 'detail', guestId],
    queryFn: () => hotelPortalService.getGuest(guestId!),
    enabled: !!guestId,
  });
}

export function useCreateGuest(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGuestDto) => hotelPortalService.createGuest(clientId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel-portal', 'guests', clientId] }),
  });
}

export function useAddGuestStay(guestId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddGuestStayDto) => hotelPortalService.addGuestStay(guestId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel-portal', 'guests', 'detail', guestId] }),
  });
}
