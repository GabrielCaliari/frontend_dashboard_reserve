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
  // Motor de reservas (calendario de ocupacao, tarifas, reservas,
  // acomodacoes). O backend usa o mesmo nome -- sem alias.
  "motor",
  "metrics",
] as const;

export type GateableModule = (typeof GATEABLE_MODULES)[number];
export type ModuleFlags = Record<GateableModule, boolean>;

/**
 * O catalogo do backend nao usa os mesmos nomes: la o dominio do hotel se chama
 * "client-portal" e as metricas do dashboard, "stats". A traducao precisa valer
 * nos dois sentidos -- ler o que o backend devolve e escrever com o nome que ele
 * entende --, senao o flag chega ausente e assumimos `true`, gateando nada.
 */
const BACKEND_MODULE_ALIASES: Partial<
  Record<GateableModule, readonly string[]>
> = {
  hotel: ["client-portal"],
  metrics: ["stats"],
};

/** Nome que o backend espera receber ao gravar o flag deste modulo. */
export function backendModuleKey(module: GateableModule): string {
  return BACKEND_MODULE_ALIASES[module]?.[0] ?? module;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Le a entrada de um modulo aceitando tanto o nome daqui quanto os do backend.
 * O nome local sempre vence, para o dia em que os catalogos convergirem.
 */
export function readBackendModuleEntry(
  record: Record<string, unknown>,
  module: GateableModule,
): unknown {
  if (module in record) return record[module];
  for (const alias of BACKEND_MODULE_ALIASES[module] ?? []) {
    if (alias in record) return record[alias];
  }
  return undefined;
}

export function normalizeModuleFlags(input: unknown): ModuleFlags {
  const record =
    isRecord(input) && isRecord(input.values)
      ? input.values
      : isRecord(input)
        ? input
        : {};
  return Object.fromEntries(
    GATEABLE_MODULES.map((module) => {
      const value = readBackendModuleEntry(record, module);
      return [module, typeof value === "boolean" ? value : true];
    }),
  ) as ModuleFlags;
}

/** Converte os flags daqui para o formato que o endpoint de escrita espera. */
export function toBackendModulePatch(
  patch: Partial<Record<GateableModule, boolean>>,
): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(patch)
      .filter((entry): entry is [GateableModule, boolean] =>
        typeof entry[1] === "boolean",
      )
      .map(([module, enabled]) => [backendModuleKey(module), enabled]),
  );
}
