/**
 * Stats Types
 * Based on backend API - /stats endpoints
 */

// ──────────────────────────────────────────────
// Dashboard
// ──────────────────────────────────────────────

export interface MetricValueResponse {
  key: string;
  label: string;
  value: number | string;
  unit?: string;
  trend?: number;
  metadata?: Record<string, unknown>;
}

export interface MetricGroupResponse {
  moduleKey: string;
  label: string;
  description?: string;
  fetchedAt: string;
  error?: string;
  metrics: MetricValueResponse[];
}

export interface DashboardResponse {
  generatedAt: string;
  groups: MetricGroupResponse[];
}

export type StatsModuleResponse = MetricGroupResponse;

export type StatsTimeseriesGranularity = "hour" | "day" | "week" | "month";

export interface StatsTimeseriesPoint {
  date: string;
  value: number;
}

export interface StatsTimeseriesItem {
  moduleKey: string;
  label: string;
  metricKey: string;
  metricLabel: string;
  granularity: StatsTimeseriesGranularity;
  from: string;
  to: string;
  series: StatsTimeseriesPoint[];
}

export interface StatsTimeseriesResponse {
  series: StatsTimeseriesItem[];
}

export interface StatsDashboardQuery {
  from?: string;
  to?: string;
}

export interface StatsTimeseriesQuery extends StatsDashboardQuery {
  granularity?: StatsTimeseriesGranularity;
  module?: string;
}

// ──────────────────────────────────────────────
// Integrations
// ──────────────────────────────────────────────

export interface StatsIntegration {
  id: string;
  tenant_id: string;
  key: string;
  label: string;
  config: Record<string, unknown>;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConfigSchemaField {
  type: "string" | "json";
  required: boolean;
  secret?: boolean;
  description: string;
}

export interface AvailableIntegration {
  key: string;
  label: string;
  description: string;
  configSchema: Record<string, ConfigSchemaField>;
}

export interface CreateStatsIntegrationDto {
  key: string;
  label: string;
  config: Record<string, unknown>;
}

export interface UpdateStatsIntegrationDto {
  label?: string;
  config?: Record<string, unknown>;
  active?: boolean;
}
