/**
 * §3.11 — Plano Semestral. Editing is admin-only per master doc §3.11
 * ("editável apenas por admin") — this portal only renders the read view.
 *
 * BLOCKED (backend): `GET /portal/plan/current` reads `plano_semestral`/
 * `plano_entregas` (master doc §4.2/§3.11), not built.
 */
export type DeliveryStatus = "planejado" | "em_andamento" | "concluido";

export interface PlanDelivery {
  id: string;
  mes: string; // e.g. "2026-08"
  titulo: string;
  descricao: string;
  status: DeliveryStatus;
  milestone_id: string | null;
  ordem: number;
}

export interface SemesterPlan {
  id: string;
  semestre: string; // e.g. "2026-2"
  titulo: string;
  eixos: string[]; // eixos estratégicos
  entregas: PlanDelivery[];
}
