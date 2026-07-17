/**
 * §3.7 — Relatórios: fixed 4-paragraph structure.
 *
 * BLOCKED (backend): master doc §4.1 lists "Relatórios com rascunho/
 * publicação" as already existing — but as an admin-side drafting flow.
 * This needs a client-scoped, published-only, read-only endpoint, which
 * doesn't exist yet (plan Assumption 6).
 */
export interface PortalReportSummary {
  id: string;
  title: string;
  excerpt: string;
  period_start: string;
  period_end: string;
  published_at: string;
}

export interface PortalReport extends PortalReportSummary {
  o_que_aconteceu: string;
  por_que_aconteceu: string;
  proximo_ciclo: string;
  destaque: string | null;
}
