import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hotelPortalService } from "@/src/common/services/hotel-portal-service";
import type {
  CreateHotelClientDto,
  UpdateHotelClientDto,
} from "@/src/shared/domain/types/@hotel-portal";

export function useHotelClients() {
  return useQuery({
    queryKey: ["hotel-portal", "clients"],
    queryFn: () => hotelPortalService.listClients(),
  });
}

export function useHotelClient(id: string | null) {
  return useQuery({
    queryKey: ["hotel-portal", "clients", id],
    queryFn: () => hotelPortalService.getClient(id!),
    enabled: !!id,
  });
}

export function useCreateHotelClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHotelClientDto) =>
      hotelPortalService.createClient(data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["hotel-portal", "clients"] }),
  });
}

export function useUpdateHotelClient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateHotelClientDto) =>
      hotelPortalService.updateClient(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hotel-portal", "clients"] });
      qc.invalidateQueries({ queryKey: ["hotel-portal", "clients", id] });
    },
  });
}
