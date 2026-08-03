import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/modules/hotel-portal/infrastructure/adapters';
import type { PublishReportDto, CreateReportDto, SubmitReviewDto } from '@/src/shared/domain/types/@hotel-portal';

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
    mutationFn: (data: Omit<CreateReportDto, 'client_id'>) =>
      hotelPortalService.createReport({ ...data, client_id: clientId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel-portal', 'reports', clientId] }),
  });
}

export function useSubmitReportForReview(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: SubmitReviewDto }) =>
      hotelPortalService.submitReportForReview(reportId, data),
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
