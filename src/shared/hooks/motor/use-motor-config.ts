import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motorService } from '@/src/modules/motor/infrastructure/adapters';
import type {
  CreateMotorPolicyDto,
  CreateMotorPriceRuleDto,
  CreateMotorRoomTypeDto,
  CreateMotorSeasonDto,
  CreateMotorUnitDto,
  UpdateMotorRoomTypeDto,
  UpsertMotorDailyInventoryDto,
} from '@/src/shared/domain/types/@motor';

// Todos recebem tenantId explicito e ficam desabilitados enquanto ele for
// nulo — mesma regra dos hooks do hotel-portal (nunca sessao implicita).

export function useMotorRoomTypes(tenantId: string | null) {
  return useQuery({
    queryKey: ['motor', 'room-types', tenantId],
    queryFn: () => motorService.listRoomTypes(tenantId!),
    enabled: !!tenantId,
  });
}

function useInvalidate(keys: string[][]) {
  const qc = useQueryClient();
  return () => keys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
}

export function useCreateRoomType(tenantId: string) {
  const invalidate = useInvalidate([['motor', 'room-types', tenantId]]);
  return useMutation({
    mutationFn: (dto: CreateMotorRoomTypeDto) => motorService.createRoomType(tenantId, dto),
    onSuccess: invalidate,
  });
}

export function useUpdateRoomType(tenantId: string) {
  const invalidate = useInvalidate([['motor', 'room-types', tenantId]]);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateMotorRoomTypeDto }) =>
      motorService.updateRoomType(tenantId, id, dto),
    onSuccess: invalidate,
  });
}

export function useCreateUnit(tenantId: string) {
  const invalidate = useInvalidate([['motor', 'room-types', tenantId]]);
  return useMutation({
    mutationFn: (dto: CreateMotorUnitDto) => motorService.createUnit(tenantId, dto),
    onSuccess: invalidate,
  });
}

export function useUpdateUnit(tenantId: string) {
  const invalidate = useInvalidate([['motor', 'room-types', tenantId]]);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { identificador?: string; ativo?: boolean } }) =>
      motorService.updateUnit(tenantId, id, dto),
    onSuccess: invalidate,
  });
}

export function useMotorTarifas(tenantId: string | null) {
  return useQuery({
    queryKey: ['motor', 'tarifas', tenantId],
    queryFn: () => motorService.getTarifas(tenantId!),
    enabled: !!tenantId,
  });
}

const tarifaKeys = (tenantId: string) => [
  ['motor', 'tarifas', tenantId],
  ['motor', 'daily-inventory', tenantId],
];

export function useCreateSeason(tenantId: string) {
  const invalidate = useInvalidate(tarifaKeys(tenantId));
  return useMutation({
    mutationFn: (dto: CreateMotorSeasonDto) => motorService.createSeason(tenantId, dto),
    onSuccess: invalidate,
  });
}

export function useUpdateSeason(tenantId: string) {
  const invalidate = useInvalidate(tarifaKeys(tenantId));
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateMotorSeasonDto> }) =>
      motorService.updateSeason(tenantId, id, dto),
    onSuccess: invalidate,
  });
}

export function useDeleteSeason(tenantId: string) {
  const invalidate = useInvalidate(tarifaKeys(tenantId));
  return useMutation({
    mutationFn: (id: string) => motorService.deleteSeason(tenantId, id),
    onSuccess: invalidate,
  });
}

export function useCreatePriceRule(tenantId: string) {
  const invalidate = useInvalidate(tarifaKeys(tenantId));
  return useMutation({
    mutationFn: (dto: CreateMotorPriceRuleDto) => motorService.createPriceRule(tenantId, dto),
    onSuccess: invalidate,
  });
}

export function useUpdatePriceRule(tenantId: string) {
  const invalidate = useInvalidate(tarifaKeys(tenantId));
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateMotorPriceRuleDto> }) =>
      motorService.updatePriceRule(tenantId, id, dto),
    onSuccess: invalidate,
  });
}

export function useDeletePriceRule(tenantId: string) {
  const invalidate = useInvalidate(tarifaKeys(tenantId));
  return useMutation({
    mutationFn: (id: string) => motorService.deletePriceRule(tenantId, id),
    onSuccess: invalidate,
  });
}

export function useCreatePolicy(tenantId: string) {
  const invalidate = useInvalidate([['motor', 'tarifas', tenantId]]);
  return useMutation({
    mutationFn: (dto: CreateMotorPolicyDto) => motorService.createPolicy(tenantId, dto),
    onSuccess: invalidate,
  });
}

export function useUpdatePolicy(tenantId: string) {
  const invalidate = useInvalidate([['motor', 'tarifas', tenantId]]);
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: Partial<CreateMotorPolicyDto> }) =>
      motorService.updatePolicy(tenantId, id, dto),
    onSuccess: invalidate,
  });
}

export function useMotorDailyInventory(
  tenantId: string | null,
  params: { room_type_id: string; from: string; to: string } | null,
) {
  return useQuery({
    queryKey: ['motor', 'daily-inventory', tenantId, params],
    queryFn: () => motorService.listDailyInventory(tenantId!, params!),
    enabled: !!tenantId && !!params?.room_type_id,
  });
}

export function useUpsertDailyInventory(tenantId: string) {
  const invalidate = useInvalidate([['motor', 'daily-inventory', tenantId]]);
  return useMutation({
    mutationFn: (dto: UpsertMotorDailyInventoryDto) =>
      motorService.upsertDailyInventory(tenantId, dto),
    onSuccess: invalidate,
  });
}
