import { cn } from "@/src/shared/lib/utils";
import type { ConversationMessage } from "@/src/modules/portal/domain/portal-attendance";

const roleStyles: Record<ConversationMessage["role"], string> = {
  user: "self-start bg-muted",
  assistant: "self-end bg-primary/10",
  human: "self-end bg-emerald-100",
};

const roleLabel: Record<ConversationMessage["role"], string> = {
  user: "Hóspede",
  assistant: "Bot",
  human: "Equipe do hotel",
};

export function ConversationTranscript({ messages }: { messages: ConversationMessage[] }) {
  return (
    <div className="flex flex-col gap-2">
      {messages.map((msg) => (
        <div
          key={msg.id}
          data-testid={`message-${msg.id}`}
          data-role={msg.role}
          className={cn("max-w-[85%] rounded-lg px-3 py-2 text-sm", roleStyles[msg.role])}
        >
          <p className="mb-0.5 text-xs font-medium text-muted-foreground">{roleLabel[msg.role]}</p>
          <p>{msg.content}</p>
        </div>
      ))}
    </div>
  );
}
