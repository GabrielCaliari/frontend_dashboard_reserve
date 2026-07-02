/**
 * §3.9 "Regras inegociáveis": a janela de atribuição precisa estar sempre
 * visível onde números derivados de atribuição aparecem.
 *
 * BLOCKED (backend): `attribution_settings` (master doc §4.2) and its read
 * endpoint don't exist yet. `<AttributionWindowBanner>` takes `windowDays`
 * as a plain prop so every consumer renders correctly the moment it has a
 * value, decoupling this from the backend timeline entirely.
 */
export interface AttributionSettings {
  window_days: number;
  source_priority: "ultimo_toque" | "primeiro_toque";
}
