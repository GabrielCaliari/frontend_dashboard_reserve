// Formatação centralizada do Hotel Portal (Doc 03 §5.3).
// A API manda dinheiro em CENTAVOS — sempre dividir por 100 antes de exibir.

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

const DECIMAL = new Intl.NumberFormat('pt-BR');

/** Centavos (inteiro) → "R$ 1.250,00". */
export function formatMoney(cents: number | null | undefined): string {
  if (cents == null) return '—';
  return BRL.format(cents / 100);
}

/** Número inteiro → "1.250". */
export function formatNumber(n: number | null | undefined): string {
  if (n == null) return '—';
  return DECIMAL.format(n);
}

/** 72.6 → "72,6%". `digits` casas decimais (default 1). */
export function formatPercent(
  value: number | null | undefined,
  digits = 1,
): string {
  if (value == null) return '—';
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export type DeltaKind = 'pp' | 'pct' | 'abs';

/**
 * Formata um delta para exibição com sinal.
 * - 'pp'  → pontos percentuais: "+8,6 p.p."
 * - 'pct' → variação relativa:  "+18%"
 * - 'abs' → valor absoluto:     "+62"
 */
export function formatDelta(
  delta: number | null | undefined,
  kind: DeltaKind = 'pct',
): string {
  if (delta == null) return '';
  const sign = delta > 0 ? '+' : '';
  if (kind === 'pp') return `${sign}${formatPercent(delta).replace('%', '')} p.p.`;
  if (kind === 'abs') return `${sign}${formatNumber(delta)}`;
  return `${sign}${Math.round(delta)}%`;
}

/** Direção do delta para colorir (↑ verde / ↓ vermelho / neutro). */
export function deltaDirection(
  delta: number | null | undefined,
): 'up' | 'down' | 'neutral' {
  if (delta == null || delta === 0) return 'neutral';
  return delta > 0 ? 'up' : 'down';
}

/** "2026-05" → "maio/2026". Aceita ISO date completo também. */
export function formatMonthLabel(month: string): string {
  const [y, m] = month.slice(0, 7).split('-');
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

/** ISO date → "01/05". */
export function formatDayMonth(iso: string): string {
  return iso.slice(5, 10).split('-').reverse().join('/');
}
