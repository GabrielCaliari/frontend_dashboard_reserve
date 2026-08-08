import { cn } from "@/src/shared/lib/utils";
import type { ConversationMessage } from "@/src/shared/domain/types/@hotel-painel";

const roleStyles: Record<string, string> = {
  user: "self-start bg-muted",
  assistant: "self-end bg-primary/10",
  human: "self-end bg-emerald-100",
};

const roleLabel: Record<string, string> = {
  user: "Hóspede",
  assistant: "Bot",
  human: "Equipe do hotel",
};

/**
 * O backend devolve `contentPreview` (previa), nao a mensagem inteira — a
 * transcricao completa vive no Chatwoot. Nao tente reconstruir o conteudo aqui.
 */
export function ConversationTranscript({
  messages,
}: {
  messages: ConversationMessage[];
}) {
  return (
    <div className="flex flex-col gap-2">
      {messages.map((msg, index) => (
        <div
          key={`${msg.ocorridoEm}-${index}`}
          data-role={msg.role}
          className={cn(
            "max-w-[85%] rounded-lg px-3 py-2 text-sm",
            roleStyles[msg.role] ?? "self-start bg-muted",
          )}
        >
          <p className="mb-0.5 text-xs font-medium text-muted-foreground">
            {roleLabel[msg.role] ?? msg.role}
            {msg.tipo === "audio" && " · áudio transcrito"}
          </p>
          <p>{msg.contentPreview ?? "—"}</p>
        </div>
      ))}
    </div>
  );
}
