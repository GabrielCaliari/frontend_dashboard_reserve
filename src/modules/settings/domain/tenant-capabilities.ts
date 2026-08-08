import type { AdminRoleValue } from "@/src/shared/domain/access-management/admin-role";
import {
  GATEABLE_MODULES,
  type GateableModule,
  type ModuleFlags,
} from "./tenant-modules";

export type TenantType = "MASTER" | "COMMON" | "EDUCATIONAL";
export type ModulePolicySource =
  | "master"
  | "tenantOverride"
  | "tenantTypePolicy";

export interface ModulePolicyResolution {
  enabled: boolean;
  source: ModulePolicySource;
}

export interface TenantCapabilities {
  tenantId: string;
  tenantType: TenantType;
  isMasterTenant: boolean;
  role: AdminRoleValue;
  /** Resolucao crua por modulo, incluindo a origem da heranca. */
  moduleResolutions: Partial<Record<GateableModule, ModulePolicyResolution>>;
  /** Visao no formato ModuleFlags (Record<GateableModule, boolean>) para os filtros de nav/dashboard. */
  modules: ModuleFlags;
  permissions: ReadonlySet<string>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const VALID_TENANT_TYPES: readonly TenantType[] = [
  "MASTER",
  "COMMON",
  "EDUCATIONAL",
];
const VALID_ROLES: readonly AdminRoleValue[] = [
  "super_admin",
  "owner",
  "manager",
  "editor",
  "viewer",
];
const VALID_SOURCES: readonly ModulePolicySource[] = [
  "master",
  "tenantOverride",
  "tenantTypePolicy",
];

function normalizeTenantType(value: unknown): TenantType {
  return typeof value === "string" &&
    (VALID_TENANT_TYPES as readonly string[]).includes(value)
    ? (value as TenantType)
    : "COMMON";
}

function normalizeRole(value: unknown): AdminRoleValue {
  return typeof value === "string" &&
    (VALID_ROLES as readonly string[]).includes(value)
    ? (value as AdminRoleValue)
    : "viewer";
}

/**
 * O catalogo do backend nao e identico ao daqui: la o dominio do hotel se chama
 * "client-portal" e as metricas do dashboard, "stats". Sem essa traducao o
 * modulo chega ausente e `toModuleFlags` assume `true` -- ou seja, Hotel
 * Marketing apareceria para todo tenant, gateado por nada.
 */
const BACKEND_MODULE_ALIASES: Partial<Record<GateableModule, readonly string[]>> =
  {
    hotel: ["client-portal"],
    metrics: ["stats"],
  };

function readModuleEntry(value: Record<string, unknown>, module: GateableModule) {
  const direct = value[module];
  if (isRecord(direct)) return direct;
  for (const alias of BACKEND_MODULE_ALIASES[module] ?? []) {
    const aliased = value[alias];
    if (isRecord(aliased)) return aliased;
  }
  return undefined;
}

function normalizeModuleResolutions(
  value: unknown,
): Partial<Record<GateableModule, ModulePolicyResolution>> {
  if (!isRecord(value)) return {};
  const result: Partial<Record<GateableModule, ModulePolicyResolution>> = {};
  for (const module of GATEABLE_MODULES) {
    const entry = readModuleEntry(value, module);
    if (!entry) continue;
    const source =
      typeof entry.source === "string" &&
      (VALID_SOURCES as readonly string[]).includes(entry.source)
        ? (entry.source as ModulePolicySource)
        : "tenantTypePolicy";
    result[module] = { enabled: entry.enabled === true, source };
  }
  return result;
}

function toModuleFlags(
  resolutions: Partial<Record<GateableModule, ModulePolicyResolution>>,
): ModuleFlags {
  return Object.fromEntries(
    GATEABLE_MODULES.map((module) => [
      module,
      resolutions[module]?.enabled ?? true,
    ]),
  ) as ModuleFlags;
}

function normalizePermissions(value: unknown): ReadonlySet<string> {
  return new Set(
    Array.isArray(value)
      ? value.filter((entry): entry is string => typeof entry === "string")
      : [],
  );
}

export function normalizeTenantCapabilities(raw: unknown): TenantCapabilities {
  const record = isRecord(raw) ? raw : {};
  const moduleResolutions = normalizeModuleResolutions(record.modules);
  return {
    tenantId: typeof record.tenantId === "string" ? record.tenantId : "",
    tenantType: normalizeTenantType(record.tenantType),
    isMasterTenant: record.isMasterTenant === true,
    role: normalizeRole(record.role),
    moduleResolutions,
    modules: toModuleFlags(moduleResolutions),
    permissions: normalizePermissions(record.permissions),
  };
}
