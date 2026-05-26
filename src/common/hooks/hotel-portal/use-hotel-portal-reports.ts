import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/common/services/hotel-portal-service';
import type { PublishReportDto, CreateReportDto } from '@/src/common/@types/@hotel-portal';

export function useHotelPortalReports(clientId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'reports', clientId],
    queryFn: () => hotelPortalService.listReports(clientId!),
    enabled: !!clientId,
  });
}

export function useCreateReport(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReportDto) => hotelPortalService.createReport(clientId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel-portal', 'reports', clientId] }),
  });
}

export function usePublishReport(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: PublishReportDto }) =>
      hotelPortalService.publishReport(reportId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel-portal', 'reports', clientId] }),
  });
}

export function useUpdateReport(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: Partial<PublishReportDto> }) =>
      hotelPortalService.updateReport(reportId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel-portal', 'reports', clientId] }),
  });
}
