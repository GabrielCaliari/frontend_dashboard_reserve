/**
 * Mapeia uma chave de evento de dominio do backend (Notification.eventKey) para
 * uma chave de mensagem i18n sob o namespace `notifications`. Espelha o catalogo
 * do backend (reserve-notifications/domain/constants/notification-events.ts,
 * que hoje tem 3 eventos: lead.created, subscription.expiring, subscription.expired).
 * Chaves desconhecidas caem na propria chave crua, entao um evento novo do
 * backend ainda renderiza algo legivel em vez de sumir.
 */
const EVENT_LABEL_KEYS: Record<string, string> = {
  "lead.created": "eventLeadCreated",
  "subscription.expiring": "eventSubscriptionExpiring",
  "subscription.expired": "eventSubscriptionExpired",
};

export function resolveEventLabel(
  eventKey: string | null | undefined,
  t: (key: string) => string,
): string | null {
  if (!eventKey) return null;
  const messageKey = EVENT_LABEL_KEYS[eventKey];
  return messageKey ? t(messageKey) : eventKey;
}
