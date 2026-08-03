import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hotelPortalService } from '@/src/modules/hotel-portal/infrastructure/adapters';
import type {
  InsertReputationDto,
  InsertKpiDto,
  InsertBookingWindowDto,
  InsertRateParityDto,
  InsertBudgetDto,
} from '@/src/shared/domain/types/@hotel-portal';

// ── Reputation ─────────────────────────────────────────────────────────────

export function useReputation(clientId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'metrics', 'reputation', clientId],
    queryFn: () => hotelPortalService.listReputation(clientId!),
    enabled: !!clientId,
  });
}

export function useReputationSummary(clientId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'metrics', 'reputation', 'summary', clientId],
    queryFn: () => hotelPortalService.getReputationSummary(clientId!),
    enabled: !!clientId,
  });
}

export function useInsertReputation(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertReputationDto) => hotelPortalService.insertReputation(clientId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'metrics', 'reputation', clientId] });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'metrics', 'reputation', 'summary', clientId] });
    },
  });
}

// ── KPI ────────────────────────────────────────────────────────────────────

export function useKpi(clientId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'metrics', 'kpi', clientId],
    queryFn: () => hotelPortalService.listKpi(clientId!),
    enabled: !!clientId,
  });
}

export function useKpiSummary(clientId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'metrics', 'kpi', 'summary', clientId],
    queryFn: () => hotelPortalService.getKpiSummary(clientId!),
    enabled: !!clientId,
  });
}

export function useInsertKpi(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertKpiDto) => hotelPortalService.insertKpi(clientId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'metrics', 'kpi', clientId] });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'metrics', 'kpi', 'summary', clientId] });
    },
  });
}

// ── Booking Window ─────────────────────────────────────────────────────────

export function useBookingWindow(clientId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'metrics', 'booking-window', clientId],
    queryFn: () => hotelPortalService.listBookingWindow(clientId!),
    enabled: !!clientId,
  });
}

export function useInsertBookingWindow(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertBookingWindowDto) => hotelPortalService.insertBookingWindow(clientId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hotel-portal', 'metrics', 'booking-window', clientId] }),
  });
}

// ── Rate Parity ────────────────────────────────────────────────────────────

export function useRateParity(clientId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'metrics', 'rate-parity', clientId],
    queryFn: () => hotelPortalService.listRateParity(clientId!),
    enabled: !!clientId,
  });
}

export function useRateParityViolations(clientId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'metrics', 'rate-parity', 'violations', clientId],
    queryFn: () => hotelPortalService.getRateParityViolations(clientId!),
    enabled: !!clientId,
  });
}

export function useInsertRateParity(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertRateParityDto) => hotelPortalService.insertRateParity(clientId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'metrics', 'rate-parity', clientId] });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'metrics', 'rate-parity', 'violations', clientId] });
    },
  });
}

// ── Budget ─────────────────────────────────────────────────────────────────

export function useBudget(clientId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'metrics', 'budget', clientId],
    queryFn: () => hotelPortalService.listBudget(clientId!),
    enabled: !!clientId,
  });
}

export function useBudgetComparison(clientId: string | null) {
  return useQuery({
    queryKey: ['hotel-portal', 'metrics', 'budget', 'comparison', clientId],
    queryFn: () => hotelPortalService.getBudgetComparison(clientId!),
    enabled: !!clientId,
  });
}

export function useInsertBudget(clientId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: InsertBudgetDto) => hotelPortalService.insertBudget(clientId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'metrics', 'budget', clientId] });
      qc.invalidateQueries({ queryKey: ['hotel-portal', 'metrics', 'budget', 'comparison', clientId] });
    },
  });
}
