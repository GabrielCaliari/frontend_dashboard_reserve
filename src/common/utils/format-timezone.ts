const DEFAULT_TIMEZONE = "America/Sao_Paulo";

function deriveUtcOffset(timezone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    if (tzPart?.value) return `(${tzPart.value.replace("GMT", "UTC")})`;
  } catch {}
  return "";
}

/**
 * Formats a date in the tenant's IANA timezone.
 * Returns: "26/05/2026 09:00 — America/Sao_Paulo (UTC-3)"
 */
export function formatInTenantTimezone(
  date: Date | string,
  timezone = DEFAULT_TIMEZONE,
  options: { showUtcOffset?: boolean } = {},
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const showUtcOffset = options.showUtcOffset !== false;
  try {
    const formatted = new Intl.DateTimeFormat("pt-BR", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
    const utcPart = showUtcOffset ? ` ${deriveUtcOffset(timezone)}` : "";
    return `${formatted} — ${timezone}${utcPart}`;
  } catch {
    return d.toISOString();
  }
}

/**
 * Formats only the date portion in the tenant's timezone.
 * Returns: "26/05/2026"
 */
export function formatDateInTenantTimezone(
  date: Date | string,
  timezone = DEFAULT_TIMEZONE,
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: timezone,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  } catch {
    return d.toISOString().split("T")[0];
  }
}
