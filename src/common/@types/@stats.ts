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
  type: 'string' | 'json';
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
