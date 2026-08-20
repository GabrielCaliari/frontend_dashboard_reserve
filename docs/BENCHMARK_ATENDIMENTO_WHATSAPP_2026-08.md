# Benchmark — Atendimento automatizado por WhatsApp (API oficial) · Agosto 2026

Pesquisa de mercado para validar a estrutura do painel Réserve (inbox, funil, retomada, motor, dashboards) contra 13 players: nicho hoteleiro (**Asksuite, HiJiffy** + Quicktext, Runnr.ai, Book Me Bob), brasileiros horizontais (**Take Blip, Kommo, Umbler Talk, Octadesk, Zenvia/Huggy, Letalk**) e globais (**respond.io, Wati, SleekFlow, Trengo**) + **Chatwoot** (nossa camada de resposta). Fontes: documentações oficiais, help centers, changelogs 2024–2026 e reviews (G2/HotelTechReport).

## 1. Veredito: estamos no caminho certo?

**Sim — a estrutura está validada pelo mercado, com um diferencial que ninguém tem.** Três provas:

1. **Inbox estilo WhatsApp Web com etiquetas de estágio é o padrão da indústria** (Umbler Talk vende literalmente "estilo WhatsApp Web"; todos usam lista + conversa + etiquetas/filtros). Nossos table stakes estão cobertos.
2. **Kanban de estágios com o dinheiro visível é o modelo dos líderes de conversão** (Kommo e Asksuite). A HiJiffy — maior concorrente do nicho — nem tem funil; tratamos vendas como o Asksuite trata, e é o Asksuite quem divulga ROI de 23–40x.
3. **Ninguém fecha reserva com pagamento dentro do chat.** Asksuite e HiJiffy consultam disponibilidade em tempo real mas **redirecionam para o motor do hotel** na hora de pagar. Nosso combo motor próprio + hold + Pix/cartão Asaas na conversa é diferencial único entre os 13.

Bônus: nossa **retomada com estágio de retorno** é mais sofisticada que a do Asksuite (lá, devolver ao bot = "reiniciar o robô"); o handback de 1 clique existe limpo só no Chatwoot — que é justamente a nossa camada.

## 2. Diferenciais confirmados (manter e comunicar)

| Nosso | Quem mais tem |
|---|---|
| Pagamento (Pix/cartão) e hold dentro da conversa | Ninguém (HiJiffy cobra só depósito via gateway) |
| Receita como KPI de 1ª classe no dashboard | Só Kommo (horizontal) e Asksuite (nicho) |
| Retomada humana com estágio de retorno + registro de quem assumiu | Parcial no Asksuite; handback limpo só no Chatwoot |
| Funil sincronizado com o motor no banco (pagamento → Reserva confirmada) | Asksuite move card por tags automáticas; demais são manuais |
| Transcrição de áudio contada em métrica | Wati (Astra), Chatwoot Captain; raro nos demais |

## 3. Gaps ranqueados (o que o mercado faz e nós não)

### P0 — receita direta, base já existe

1. **Follow-up automático de cotação não fechada.** Asksuite (AskFlow) divulga ROI de 71x; Letalk tem alerta automático após 48h sem resposta. Nós JÁ temos o dado ("a recuperar" = holds expirados) e o follow-up de pagamento do bot — falta a esteira: sequência automática no WhatsApp para quem recebeu preço e não pagou, com relatório de recuperação.
2. **Kanban com totais por coluna e tempo de espera no card** (Asksuite Auto Kanban): nº de conversas, **R$ em cotações abertas** e confirmadas no topo de cada estágio; tempo de espera do hóspede visível no card. Encaixe direto no nosso kanban de 9 estágios.
3. **Movimento automático de card por evento do motor** (Asksuite via tags; Kommo/Letalk via automação): já fizemos pagamento→Reserva confirmada; faltam hold criado→Fechamento iniciado e hold expirado→volta com etiqueta de recuperação.
4. **Handoff padrão-ouro**: (a) bot posta **resumo + contexto como nota interna** antes de escalar (respond.io/SleekFlow/Trengo); (b) **motivo da escalação logado** (exit reasons: pediu humano / não soube / lead quente); (c) métricas do ciclo: taxa de handover, tempo-com-bot vs tempo-com-humano, FRT contado a partir do humano (Trengo/SleekFlow/Octadesk).

### P1 — monetização e operação

5. **Campanhas WhatsApp segmentadas por etiqueta/estágio** (todos os 13 vendem; Letalk filtra disparo por etapa do funil; Asksuite rastreia resultado por campanha). É a feature de receita mais vendida do mercado.
6. **Jornada pós-conversão via dados do motor** (HiJiffy Campaigns Manager: confirmação → check-in online → upsell pré-chegada → ofertas in-stay → review pós-estadia; 99% entrega / 84% abertura). Valida nossa Frente 5 — e nosso motor próprio torna mais fácil que para eles.
7. **Sinalização bot vs humano na lista do inbox** (Trengo: avatar do bot sobreposto, ícone de escalado; Octadesk: aba "Conversas do bot") + contadores por etiqueta.
8. **Fila/atribuição com dono único** (Huggy: round-robin por ociosidade + limite de chats simultâneos por agente) — para quando houver mais de um atendente por tenant; hoje o Chatwoot cobre o básico.

### P2 — refinamentos

9. **Sentiment/emoji na lista de conversas** (HiJiffy) — triagem visual de hóspede irritado; barato com IA.
10. **Copiloto de resposta com dados do motor** (Asksuite Sophia; Chatwoot Captain dá o rascunho — nosso plus seria injetar disponibilidade/preço).
11. **Horário de operação bot vs humano por canal** (Asksuite) — fora do expediente o bot nunca transfere.
12. **Tradução automática no console** (HiJiffy 130+ idiomas) — baixa prioridade no nicho pousada BR.

## 4. O que NÃO construir (o Chatwoot já dá de graça)

- **Fila "aguardando humano" + takeover + handback**: conversa nasce `pending` (bot), vira `open` no handoff, volta a `pending` com 1 clique. Nativo.
- **Colisão de agentes** (typing indicator + assignee único + auto-assignment round-robin) e **notas privadas com @menção**. Nativo.
- **CSAT no resolve, FRT humano, relatórios por agente/etiqueta**. Nativo.
- **Transcrição de voice notes** (Captain/Whisper) e **Copilot de rascunho/resumo/tradução**. Nativo.
- **Dashboard Apps**: dá para embutir a tela de reserva do NOSSO motor dentro do Chatwoot — contexto de negócio ao lado do chat sem construir inbox de escrita.

Nosso painel deve continuar leitura + deep link, lendo o status do Chatwoot — e não reconstruir atendimento.

## 5. O padrão-ouro do handoff (consenso dos 13) vs onde estamos

| Passo | Estado nosso |
|---|---|
| 1. Bot atende em fila separada (pending) | ✅ Chatwoot |
| 2. Gatilhos de escalação explícitos e LOGADOS (motivo) | ⚠️ escalamos, mas sem exit reason estruturado |
| 3. Bot coleta o que falta e posta RESUMO como nota interna | ❌ gap P0-4a |
| 4. Roteamento automático com dono único | ✅ Chatwoot (básico) |
| 5. Takeover mata o bot instantaneamente | ✅ (pausa via N8N) |
| 6. Sinalização de quem está com a bola | ⚠️ badge "pausado"; falta indicador bot/humano na lista |
| 7. Handback de 1 clique com estágio | ✅ melhor que o mercado (retomada com estágio) |
| 8. Medir o ciclo (handover rate, tempo-com-bot, FRT humano) | ❌ gap P0-4c |

## 6. Mapeamento para o roadmap

- **P0-1/2/3** → nova frente curta "Funil que se move sozinho + recuperação ativa" (front kanban + eventos do motor + esteira N8N).
- **P0-4** → junto da pendência N8N já registrada (RETOMADA_HUMANA + reserva.confirmada): incluir resumo-nota-interna e exit reason no payload.
- **P1-5/6** → é a Frente 5 (marketing/recuperação) do doc de futuro — promover de "futuro" para "próxima", com WhatsApp (não e-mail) confirmado como canal pelo benchmark.
- **P1-7 e P2** → backlog de design do inbox/funil.

*Réserve · Benchmark de mercado · fontes detalhadas nos relatórios de pesquisa (Asksuite/HiJiffy, players BR, globais/Chatwoot) — agosto 2026*
