"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { conversationHref } from "@/src/presentation/components/organisms/hotel-portal/painel/conversation-link";

/**
 * A pagina solta de transcricao foi aposentada: toda conversa abre na caixa
 * de conversas (estilo WhatsApp Web) com o contato selecionado. Links antigos
 * (/atendimento/<numero>) continuam funcionando por este redirecionamento.
 */
export default function HotelConversationDetailPage({
  params,
}: {
  params: Promise<{ numeroContato: string }>;
}) {
  const { numeroContato } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(conversationHref(decodeURIComponent(numeroContato)));
  }, [numeroContato, router]);

  return null;
}
