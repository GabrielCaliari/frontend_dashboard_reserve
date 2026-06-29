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
