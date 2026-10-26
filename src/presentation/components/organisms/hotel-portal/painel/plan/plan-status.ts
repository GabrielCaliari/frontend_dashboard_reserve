import type { SemesterPlanDeliveryStatus } from "@/src/shared/domain/types/@hotel-painel";

export const PLAN_STATUS: Record<
  SemesterPlanDeliveryStatus,
  { label: string; chip: string; bar: string }
> = {
  planejado: { label: "Planejado", chip: "bg-default-100 text-foreground/70", bar: "bg-default-300" },
  em_andamento: { label: "Em andamento", chip: "bg-warning/15 text-warning-600", bar: "bg-warning" },
  concluido: { label: "Concluído", chip: "bg-success/15 text-success-600", bar: "bg-success" },
};

export function planStatus(status: SemesterPlanDeliveryStatus) {
  return PLAN_STATUS[status] ?? PLAN_STATUS.planejado;
}
