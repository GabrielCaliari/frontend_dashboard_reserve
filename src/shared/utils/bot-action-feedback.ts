import toast from "react-hot-toast";

/** Acao humana registrada no painel, mas o bot nao foi avisado (o backend reenvia sozinho). */
export const BOT_NOT_NOTIFIED_MESSAGE =
  "Ação registrada, mas não foi possível avisar o bot agora — vamos tentar de novo automaticamente.";

/** Texto livre ao hospede: 502 do backend, nao e reenviado. */
export const BOT_MESSAGE_NOT_SENT_MESSAGE =
  "Mensagem não enviada. O bot não respondeu — tente novamente em instantes.";

/**
 * Feedback padrao das acoes humanas que o painel repassa ao bot (mover/perder,
 * retomar, pausar, estender hold, aprovar proposta). Contrato do backend: 2xx
 * com `ok: false` = registrada, bot nao avisado. Devolve true quando o bot
 * confirmou.
 */
export function notifyBotAction(result: { ok?: boolean } | null | undefined, successMessage: string): boolean {
  if (result?.ok === false) {
    toast(BOT_NOT_NOTIFIED_MESSAGE, { icon: "⚠️", duration: 6000 });
    return false;
  }
  toast.success(successMessage);
  return true;
}

/** O envio de mensagem responde 502 (e nao `ok:false` em 2xx) quando o bot esta inalcancavel. */
export function isBotUnreachableError(error: unknown): boolean {
  return (error as { response?: { status?: number } } | null)?.response?.status === 502;
}
