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
