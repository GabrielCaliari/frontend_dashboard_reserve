/** Rota da caixa de conversas (estilo WhatsApp Web) do painel do hotel. */
export const CONVERSAS_PATH = "/dashboard/hotel/atendimento/conversas";

/**
 * Link que abre a caixa de conversas ja com o contato selecionado. Toda tela
 * que aponta para uma conversa (funil, erros, feedbacks) usa isto, em vez da
 * pagina solta de transcricao que existia antes.
 */
export function conversationHref(numeroContato: string): string {
  return `${CONVERSAS_PATH}?contato=${encodeURIComponent(numeroContato)}`;
}
