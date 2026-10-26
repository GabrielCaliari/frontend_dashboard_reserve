/**
 * Aparencia comum dos graficos do painel (recharts aceita so strings de cor,
 * entao os tokens do tema entram como `hsl(var(--x))`).
 */
export const CHART_COLORS = {
  primary: "hsl(var(--primary))",
  foreground: "hsl(var(--foreground))",
  muted: "hsl(var(--muted-foreground))",
  grid: "hsl(var(--border))",
  warning: "#f59e0b",
  success: "#10b981",
} as const;

export const AXIS_TICK = { fontSize: 12, fill: CHART_COLORS.muted } as const;

export const TOOLTIP_STYLE = {
  background: "hsl(var(--background))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
  boxShadow: "none",
} as const;
