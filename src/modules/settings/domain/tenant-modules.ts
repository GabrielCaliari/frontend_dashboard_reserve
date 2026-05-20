/**
 * Catalogo de modulos gateaveis do Reserve. Distinto do catalogo da Zarp:
 * nao inclui "courses"/"brands"/"cnpjs"/"journals" (dominio exclusivo da Zarp),
 * inclui "hotel" (dominio exclusivo do Reserve: client-portal / hotel-portal).
 * "metrics" nao tem item de navegacao proprio -- existe so como modulo-fallback
 * para dashboard-visibility.ts, no mesmo papel que "courses"/"brands" tem na Zarp.
 */
export const GATEABLE_MODULES = [
  "leads",
  "cms",
  "mailer",
  "payments",
  "coupons",
  "reports",
  "notifications",
  "hotel",
  "metrics",
] as const;

export type GateableModule = (typeof GATEABLE_MODULES)[number];
export type ModuleFlags = Record<GateableModule, boolean>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function normalizeModuleFlags(input: unknown): ModuleFlags {
  const record =
    isRecord(input) && isRecord(input.values)
      ? input.values
      : isRecord(input)
        ? input
        : {};
  return Object.fromEntries(
    GATEABLE_MODULES.map((module) => [
      module,
      typeof record[module] === "boolean" ? record[module] : true,
    ]),
  ) as ModuleFlags;
}
