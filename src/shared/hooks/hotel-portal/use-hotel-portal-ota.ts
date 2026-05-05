import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hotelPortalService } from "@/src/modules/hotel-portal/infrastructure/adapters";
import type { InsertOtaDataDto } from "@/src/shared/domain/types/@hotel-portal";

export function useHotelPortalOtaData(clientId: string | null) {
  return useQuery({
    queryKey: ["hotel-portal", "ota-data", clientId],
    queryFn: () => hotelPortalService.listOtaData(clientId!),
    enabled: !!clientId,
  });
}

export function useInsertOtaData(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertOtaDataDto) =>
      hotelPortalService.insertOtaData(clientId, data),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["hotel-portal", "ota-data", clientId],
      });
      qc.invalidateQueries({
        queryKey: ["hotel-portal", "dashboard", clientId],
      });
    },
  });
}
