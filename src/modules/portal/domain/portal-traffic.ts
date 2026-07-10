export interface TrafficQuery {
  from: string;
  to: string;
}

export interface DailyTrafficPoint {
  date: string;
  investimento: number;
  conversas_iniciadas: number;
}

export interface CampaignPerformance {
  id: string;
  name: string;
  spend: number;
  reach: number;
  impressions: number;
  clicks: number;
  cpl: number;
  frequency: number;
  /** null until master doc §6's source_id attribution join lands on the backend */
  conversas_atribuidas: number | null;
  qualificados_atribuidos: number | null;
}

export interface TrafficResponse {
  headline_metrics: {
    investimento: number;
    pessoas_alcancadas: number;
    visualizacoes: number;
    conversas_iniciadas: number;
    custo_por_conversa: number;
    frequencia: number;
  };
  daily: DailyTrafficPoint[];
  biweekly_comparison: { period_label: string; investimento: number; conversas_iniciadas: number }[];
  campaigns: CampaignPerformance[];
}
