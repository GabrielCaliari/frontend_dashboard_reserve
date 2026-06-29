export interface PeriodComparisonQuery {
  metric_keys: string[];
  period: "biweekly" | "monthly";
  from: string; // ISO date
  to: string; // ISO date
}

export interface MetricComparison {
  metric_key: string;
  current_value: number;
  previous_value: number;
  variation_pct: number;
}

export interface PeriodComparisonResponse {
  period: { from: string; to: string };
  previous_period: { from: string; to: string };
  metrics: MetricComparison[];
}

export interface DailySeriesPoint {
  date: string;
  conversas_iniciadas: number;
}

export interface OverviewResponse {
  headline_metrics: MetricComparison[]; // investimento, conversas_iniciadas, custo_por_conversa
  daily_conversas: DailySeriesPoint[]; // last 30 days
  last_report_preview: { id: string; title: string; excerpt: string; published_at: string } | null;
  recent_activities: { id: string; title: string; occurred_at: string }[]; // last 5
}
