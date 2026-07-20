/**
 * §3.6 — Linha do Tempo / Antes e Depois.
 *
 * BLOCKED (backend): `GET /portal/timeline` reads `milestones`/
 * `future_plans` and the baseline-import job's output (master doc §4.2),
 * none built.
 */
export type MilestoneType = "marco_zero" | "seguidor" | "campanha" | "bot" | "recorde" | "custom";

export interface Milestone {
  id: string;
  date: string;
  title: string;
  type: MilestoneType;
}

export interface FuturePlan {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface BaselineSeriesPoint {
  date: string;
  conversas_iniciadas: number;
  /** true for the point marking marco zero — used to render the highlight */
  is_marco_zero?: boolean;
}

export interface TimelineResponse {
  milestones: Milestone[];
  future_plans: FuturePlan[];
  baseline_series: BaselineSeriesPoint[];
}
