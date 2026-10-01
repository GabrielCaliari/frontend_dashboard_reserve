# Contrato Bot ↔ Painel · v2

**Para:** time de desenvolvimento do painel RÉSERVE (frontend `frontend_dashboard_reserve`, backend `backend_reserve`)
**De:** RÉSERVE / bot de WhatsApp (N8N)
**Data:** 30/09/2026
**Substitui:** Seção 17 do Documento Mestre v8.1 e as decisões 11, 12 e 14 do Plano do Painel v2.0 no que conflitar.

---

## 1. O que mudou no bot desde agosto (contexto para o time)

O bot saiu do desenho para a operação. Hoje, no ambiente local da RÉSERVE, ele:

| Capacidade | Estado |
|---|---|
| Atende pelo número oficial da Meta (Cloud API), em coexistência com o app WhatsApp Business da pousada | Funcionando |
| Consulta disponibilidade no PMS Hospedin (API v3), calcula o preço pela tabela própria, cria o hóspede e a pré-reserva no PMS, confirma a reserva | Funcionando, testado na conta real |
| Entende a conversa com IA (OpenAI), com o roteiro de vendas da pousada; o código confere fatos e números | Funcionando |
| Reconhece 5 públicos: lead, hóspede em estadia, mensalista, cliente da marina, equipe | Funcionando |
| Transfere para a equipe com resumo e motivo; a equipe responde pelo próprio app; o bot pausa e retoma sozinho | Funcionando |
| Follow-up por origem (anúncio 72h, orgânico 24h), expiração de holds, polling do PMS, jornada do hóspede | Funcionando |
| Pagamento automático (Asaas), com confirmação por webhook | Em construção (aguarda a conta da pousada) |

Decisões que afetam o painel:

1. **O Chatwoot saiu.** O inbox humano é o próprio WhatsApp Business da pousada (coexistência). Toda referência a `chatwootDeepLink` precisa ser substituída.
2. **O painel nunca acessa o banco do bot.** Tudo chega por eventos (este contrato). O estado de um contato é o último evento dele.
3. **O bot tem 10 estados, não 2.** O frontend hoje tipa `BotContactStatus = 'ATIVO' | 'PAUSADO'`. Precisa ampliar (Seção 7).
4. **Dinheiro sempre em centavos** no contrato; o backend converte para reais onde o frontend espera reais (`valorCotacao`, `valorAberto`, `valorConfirmado`).

---

## 2. Arquitetura da integração

```
  BOT (N8N)                                   PAINEL (NestJS + Next.js)
  ─────────────────────────                   ─────────────────────────────
  funil_eventos (outbox)  ──POST a cada 1 min──▶  POST /api/ingest/bot-events
  conversas (mensagens)   ──idem (preview)──────▶     grava eventos (append-only)
  heartbeat               ──idem────────────────▶     projeta contatos / funil / métricas

  WF6 /webhook/painel     ◀──HMAC──────────────── ações do humano no painel
                                                     (mover card, devolver ao bot, enviar mensagem,
                                                      estender prazo, marcar perdido, aplicar configuração)

  WF9a polling Hospedin   ──POST──────────────▶  POST /webhooks/booking/:clientId  (já existe no backend)
```

Três canais, três responsabilidades:

| Canal | Direção | Quem implementa |
|---|---|---|
| A. Ingestão de eventos | bot → painel | Backend expõe; bot já envia (WF11) |
| B. Webhook reverso | painel → bot | Backend chama; bot já recebe (WF6) |
| C. Reservas do PMS | bot → painel | Já existe no backend (`/webhooks/booking/:clientId`); o bot passa a chamar quando o polling detectar reserva nova ou alterada |

---

## 3. Canal A · `POST /api/ingest/bot-events`

### 3.1 Requisição

```
POST /api/ingest/bot-events
Authorization: Bearer <tenant_key>          (chave emitida pelo backend, uma por tenant)
Content-Type: application/json
X-Idempotency-Key: <event_ids do lote, separados por vírgula>
```

```json
{
  "tenant_id": "cli_dona_tereza",
  "events": [ { ...evento... }, { ...evento... } ]
}
```

- Lote de até **250 eventos** por chamada (o bot manda no máximo 50 eventos de funil + 200 mensagens + 1 heartbeat).
- O bot envia a cada 1 minuto enquanto houver pendência. Se o painel estiver fora do ar, o bot guarda e reenvia (até 10 tentativas por evento, depois alerta a RÉSERVE).

### 3.2 Resposta

| Código | Quando | Efeito no bot |
|---|---|---|
| `202` | Lote aceito (mesmo que alguns `event_id` já existissem) | Marca o lote como enviado |
| `401` / `403` | Chave inválida ou tenant errado | Não marca; alerta a RÉSERVE |
| `400` | Corpo inválido | Não marca; alerta |
| `5xx` | Erro interno | Tenta de novo no próximo minuto |

Corpo da resposta (sugestão): `{ "received": 34, "duplicated": 2 }`.

### 3.3 Idempotência

`event_id` é único e global. O backend deve ignorar silenciosamente eventos já gravados e responder 202. Nunca gravar duas vezes.

### 3.4 O evento

```json
{
  "event_id": "8022b725-6f7b-4d94-a2a3-c5f0f2cb9014",
  "tenant_id": "cli_dona_tereza",
  "occurred_at": "2026-10-01T01:37:11.891Z",
  "type": "reserva.confirmada",
  "actor": { "type": "bot" | "human" | "guest", "id": "553388756884" | null },
  "contact": {
    "phone": "553598067432",
    "name": "Gabriel Caliari",
    "audience": "LEAD" | "HOSPEDE_EM_ESTADIA" | "MENSALISTA" | "MARINA" | "EQUIPE",
    "origin": "anuncio" | "organico" | "link",
    "ctwa_clid": "…" | null,
    "source_id": "…" | null,
    "link_code": "inv26" | null,
    "bot_status": "ATIVO" | "VERIFICANDO" | "AGUARDANDO_FICHA" | "AGUARDANDO_PAGAMENTO" | "EM_CONFIRMACAO" | "PAUSADO" | "PAUSADO_HUMANO" | "FECHADO" | "EM_ESTADIA" | "FRIO",
    "occasion": "romantica" | "familia" | "grupo" | "descanso" | null
  },
  "stage": "RESERVA_CONFIRMADA" | null,
  "hold": {
    "code": "M57",
    "status": "DISPONIVEL" | "AGUARDANDO" | "CONFIRMADA" | "EXPIRADA" | "CANCELADA" | "EXCECAO",
    "accommodation": "Suíte Master",
    "check_in": "2026-11-20",
    "check_out": "2026-11-22",
    "amount_cents": 104900,
    "pms_reservation_id": "r_30644146"
  } | null,
  "data": { ...campos específicos do tipo... }
}
```

Regras de leitura:

- `contact` é um **snapshot** do contato no momento do evento. O backend mantém a projeção do contato com o snapshot mais recente (por `occurred_at`).
- `stage` só vem quando o evento muda o estágio do funil. `null` = não mexe no estágio.
- `hold` vem quando há uma pré-reserva ou reserva associada ao contato. É o que alimenta `valorCotacao`, `acomodacaoInteresse`, `datasInteresse` e os totais das colunas.
- `contact` é `null` nos eventos `heartbeat`.

### 3.5 Catálogo de tipos

| `type` | `stage` | `data` | Observações |
|---|---|---|---|
| `contato.iniciado` | `CONTATO_INICIADO` | `origem`, `ctwa_clid`, `source_id`, `link_code`, `primeira_mensagem` | Um por contato |
| `publico.identificado` | `PUBLICO_IDENTIFICADO` | `audience` | |
| `qualificado` | `QUALIFICADO` | `check_in`, `check_out`, `adultos`, `criancas`, `ocasiao` | Datas e pessoas conhecidas |
| `verificacao.solicitada` / `verificacao.respondida` | `QUALIFICADO` | `codigo`, `resultado` | Só no modo handoff |
| `acomodacao.apresentada` | `ACOMODACAO_APRESENTADA` | `tag`, `codigo`, `ocasiao` | A oferta com preço foi enviada |
| `oferta.feita` | `OFERTA_FEITA` | `tipo: upsell | encantamento`, `aceito` | |
| `hold.criado` | `FECHAMENTO_INICIADO` | `codigo` | Ficha completa, pré-reserva no PMS |
| `hold.estendido` | null | `minutos` | |
| `hold.expirado` | null | `codigo`, `cancelado_no_hospedin` | Lead vira etiqueta **RECUPERAR** |
| `hold.cancelado` | null | `codigo`, `motivo` | Hóspede desistiu com hold aberto |
| `comprovante.recebido` | `COMPROVANTE_RECEBIDO` | `codigo` | Pix manual |
| `reserva.confirmada` | `RESERVA_CONFIRMADA` | `codigo`, `acomodacao`, `valor_cents` | Pelo Asaas ou pelo comando CONFIRMA |
| `transferencia` | null | `motivo`, `tag` | Motivos: `pediu_humano`, `pedido_estadia`, `grupo_grande`, `sem_disponibilidade`, `composicao`, `pet_sem_chale`, `informacao`, `ia` |
| `humano.assumiu` | null | `via: eco | comando | painel` | Equipe respondeu pelo app, ou pausou pelo painel |
| `humano.devolveu` | null | `via: eco | comando | painel | timer_2h | timer_48h` | |
| `pre_reserva` | `QUALIFICADO` | | "Vou pensar" |
| `lista_espera` | `QUALIFICADO` | | |
| `perdido` | `PERDIDO` | `motivo: caro | data | pesquisando | sumiu | outro` | |
| `followup.enviado` | null | `toque`, `regua: anuncio | organico | pre_reserva | pagamento` | |
| `followup.regua_esgotada` / `followup.fora_da_janela` | null | | Vira card "a recuperar" |
| `mensalista.aviso` / `marina.interesse` | null | | |
| `reserva.detectada_polling` / `reserva.alterada_polling` / `reserva.cancelada_polling` | null | `hospedin_id`, `status`, `check_in`, `check_out`, `place_type_id` | Reservas que NÃO vieram do bot (site, OTA, balcão) |
| `jornada.vespera` / `jornada.checkin_dia` / `jornada.encantamento` / `jornada.avaliacao` | null | `enviado`, `pendente_template` | |
| `painel.estagio` | o estágio escolhido | `via: painel`, `motivo` | Eco de `move_stage` (Canal B) |
| `config.aplicada` | null | `chave` | Eco de `apply_config` |
| `audio.transcrito` | null | `duracao_s` | Alimenta `audiosTranscritos` |
| `mensagem` | null | `role: user | assistant | human`, `kind: texto | audio | imagem | botoes | template | sistema`, `content_preview` (até 180 caracteres) | Uma por mensagem trocada. `actor.type` = `guest` quando `role = user` |
| `heartbeat` | null | `bot_enabled`, `mode`, `ai_enabled`, `last_echo_at`, `last_polling_at`, `active_conversations`, `paused_awaiting_human`, `channel` | A cada minuto. `contact` é `null` |

---

## 4. O que o backend projeta a partir dos eventos

As telas do frontend já chamam estes endpoints. A tabela diz de onde vem cada campo.

### 4.1 `GET /hotel-portal/{clientId}/whatsapp/conversations` → `ConversationListItem[]`

| Campo | Origem |
|---|---|
| `numeroContato` | `contact.phone` |
| `nome` | último `contact.name` |
| `statusBot` | último `contact.bot_status` (tipo ampliado, Seção 7) |
| `lastMessageAt` | último evento `mensagem` |
| `currentStage` | último evento com `stage` não nulo |
| `consentimentoLgpd` | manter `true` por padrão (o bot não coleta consentimento separado; a conversa é iniciada pelo hóspede) |
| ~~`chatwootDeepLink`~~ → `whatsappWebLink` | `https://web.whatsapp.com/send?phone=<numero>`. Abre a conversa no WhatsApp Web da conta logada (o da pousada) |

### 4.2 `GET /hotel-portal/{clientId}/whatsapp/conversations/{numero}` → `ConversationMessage[]`

Lista dos eventos `mensagem` do contato, em ordem: `role`, `tipo` = `data.kind`, `contentPreview` = `data.content_preview`, `ocorridoEm` = `occurred_at`. Somente leitura (decisão 11 mantida).

### 4.3 `GET /hotel-portal/{clientId}/whatsapp/funnel` → `FunnelBoardColumn[]`

| Campo | Origem |
|---|---|
| Coluna de cada lead | último `stage` do contato |
| `acomodacaoInteresse` | último `hold.accommodation` |
| `datasInteresse` | `hold.check_in` a `hold.check_out` |
| `valorCotacao` (reais) | `hold.amount_cents / 100` do hold mais recente |
| `aguardandoDesde` | último evento `mensagem` com `role = user` |
| `etiqueta = RECUPERAR` | contato com `hold.expirado` ou `followup.regua_esgotada` e sem `reserva.confirmada` depois |
| `valorAberto` (reais) | soma de `hold.amount_cents` dos leads da coluna com hold em `DISPONIVEL` ou `AGUARDANDO` ou `EXPIRADA` |
| `valorConfirmado` (reais) | soma de `reserva.confirmada.data.valor_cents` dos leads da coluna |

### 4.4 `GET /hotel-portal/{clientId}/whatsapp/funnel/metrics` → `FunnelMetricsResponse`

| Campo | Cálculo |
|---|---|
| `conversasIniciadas` | contagem de `contato.iniciado` no período |
| `taxaRespostaBot` | contatos com ao menos uma `mensagem` de `role = assistant` ÷ `contato.iniciado` |
| `tempoMedioPrimeiraRespostaSegundos` | `occurred_at` da primeira `mensagem` do bot menos a do `contato.iniciado` |
| `distribuicaoFunil` | contatos por estágio atual |
| `tempoMedioPorEstagioSegundos` | diferença entre eventos consecutivos com `stage` |
| `taxaQualificacao` | `qualificado` ÷ `contato.iniciado` |
| `leadsProntos` | contatos em `FECHAMENTO_INICIADO` ou `COMPROVANTE_RECEBIDO` |
| `taxaConversaoPorEtapa` | contatos que chegaram a cada estágio ÷ `contato.iniciado` |
| `efetividadeFollowup` | `followup.enviado` agrupado por `data.regua`; `status` = `respondeu` se houve `mensagem` do hóspede após o toque, senão `sem_resposta` |
| `volumePorOrigem` | `contato.iniciado` agrupado por `contact.origin` |
| `contatosPausados` | contatos com `bot_status` em `PAUSADO` ou `PAUSADO_HUMANO` |
| `audiosTranscritos` | contagem de `audio.transcrito` |
| `handoff.total` | contagem de `transferencia` |
| `handoff.taxaHandover` | `transferencia` ÷ `contato.iniciado` |
| `handoff.motivos` | `transferencia` agrupado por `data.motivo` |
| `handoff.tempoMedioComBotSegundos` | `transferencia.occurred_at` menos `contato.iniciado.occurred_at`, média |

### 4.5 `GET /hotel-portal/{clientId}/whatsapp/channels` → `BotChannelsResponse`

Do último `heartbeat`: `connected` = recebido há menos de 5 minutos; `botEnabled` = `data.bot_enabled`; `heartbeatAgeMinutes` = agora menos `occurred_at`; `heartbeatStale` = mais de 5 minutos; `activeConversations` e `pausedAwaitingHuman` direto do `data`.

### 4.6 `GET /hotel-portal/{clientId}/leads-overview`

Já existe (cliques nos links rastreáveis). Cruzar com `contact.link_code` dos eventos `contato.iniciado` para fechar o ciclo clique → conversa → reserva.

### 4.7 Reservas (Canal C)

O WF9a passa a chamar `POST /webhooks/booking/:clientId` para cada reserva detectada no PMS, com `engine: "hospedin"`, `status`, `channel: "direct" | "ota"`, `amount` em centavos, `checkIn`, `checkOut` e os hashes de contato que o contrato atual já define. As reservas do bot chegam com `channel: "direct"` e o `pms_reservation_id` também aparece no evento `reserva.confirmada`, o que permite ligar as duas fontes.

---

## 5. Canal B · webhook reverso (painel → bot)

### 5.1 Requisição

```
POST https://<n8n>/webhook/painel
Content-Type: application/json
X-Reserve-Signature: <hex do HMAC-SHA256 do corpo bruto, com o segredo do tenant>
```

```json
{
  "action_id": "cmg7x1k2p0000abcd1234efgh",
  "action": "move_stage",
  "tenant_id": "cli_dona_tereza",
  "phone": "553598067432",
  "actor_id": "usr_1",
  "payload": { ... }
}
```

| `action` | `payload` | Efeito no bot | Frontend que dispara |
|---|---|---|---|
| `move_stage` | `stage` (um dos 9), `reason` | Grava `painel.estagio`; não muda o atendimento | `PATCH .../funnel/{numero}/stage` |
| `return_to_bot` | | `PAUSADO` / `PAUSADO_HUMANO` → `ATIVO`; grava `humano.devolveu` | `POST .../funnel/{numero}/resume` |
| `pause_bot` | `reason` | → `PAUSADO`; grava `humano.assumiu`; encerra follow-up | Botão "assumir conversa" |
| `extend_hold` | `codigo` (opcional), `minutes` (padrão 60) | Soma minutos ao prazo do hold `AGUARDANDO` | Botão no card |
| `mark_lost` | `reason` | → `FRIO`; grava `perdido`; encerra follow-up | Mover card para Perdido |
| `send_message` | `text` | Envia pela Meta, grava como `human`, bot fica `PAUSADO_HUMANO` | `POST /admin/.../whatsapp/{clientId}/send` |
| `apply_config` | `key`, `value` | Atualiza a configuração do bot (proposta aprovada) | Aprovação em `bot-config-proposals` |

### 5.2 Resposta

`200 { "ok": true, "state": "ATIVO", "action": "return_to_bot" }`
`401` assinatura inválida · `403` tenant errado · `400` action inválida

### 5.3 Regras

- O backend grava a ação como evento próprio **antes** de chamar o bot. Se a chamada falhar, um job reconcilia depois (decisão 12).
- `action_id` identifica a ação no painel e se repete nos reenvios. O bot ignora repetições do mesmo id sem gravar evento duplicado. É um id opaco (cuid, não UUID).
- `phone` vai só com dígitos (55 + DDD + número); `stage` em maiúsculas, um dos 9 estágios.
- Em produção a URL do WF6 precisa ser `https` com domínio público (o backend recusa endereço interno).
- `send_message` só funciona dentro da janela de 24h da Meta; fora dela o bot responde `200` com `state` e o backend deve avisar o usuário que a mensagem pode não ser entregue (o bot registra o erro da Meta no evento seguinte).
- `apply_config` não pode alterar chaves de credencial (o bot recusa).

---

## 6. Propostas de configuração (`bot-config-proposals`)

O frontend já tem o formulário e a listagem. Fluxo completo:

1. Cliente propõe (`campo`, `categoria: pricing | policies | packages | hours`, `valor_atual`, `valor_proposto`, `justificativa`)
2. RÉSERVE aprova ou rejeita no painel global
3. Ao aprovar, o backend chama o Canal B com `apply_config` e `{ key, value }`
4. O bot responde com o estado e grava `config.aplicada`

Chaves que o bot aceita hoje por essa via (categoria entre parênteses):

| Chave | Categoria | Exemplo |
|---|---|---|
| `tarifa:<place_type_id>:<A|B|C>` | pricing | `tarifa:361057:A` = `33900` (centavos) |
| `valor_pessoa_adicional_cents` · `valor_taxa_pet_cents` · `desconto_sem_cafe_cents` · `percentual_desconto_marina` | pricing | |
| `hold_min_pix_manual` · `hold_min_cartao` · `hold_min_pix_link` | policies | minutos |
| `hospedin_chale_familia_bloqueado` | packages | `ON` / `OFF` |
| `calendario:<AAAA-MM-DD>` | pricing | `C` (marca feriado) |
| `resumo_dia_hora` | hours | `20` |

As chaves `tarifa:*` e `calendario:*` são traduzidas pelo bot para as tabelas `tarifas` e `calendario_especial` (ajuste pendente no WF6, previsto para a próxima versão).

---

## 7. Mudanças no frontend

| Onde | Mudança |
|---|---|
| `BotContactStatus` | Ampliar para os 10 estados: `ATIVO`, `VERIFICANDO`, `AGUARDANDO_FICHA`, `AGUARDANDO_PAGAMENTO`, `EM_CONFIRMACAO`, `PAUSADO`, `PAUSADO_HUMANO`, `FECHADO`, `EM_ESTADIA`, `FRIO`. Rótulos sugeridos: "Atendendo", "Equipe verificando", "Preenchendo ficha", "Aguardando pagamento", "Conferindo comprovante", "Transferido", "Com a equipe", "Reserva feita", "Hospedado", "Esfriou" |
| `ConversationListItem.chatwootDeepLink` | Renomear para `whatsappWebLink` e trocar o botão "Abrir no Chatwoot" por "Abrir no WhatsApp Web" |
| Inbox | Mostrar `contact.occasion` e o `hold` (acomodação, datas, valor) no cabeçalho da conversa: é o que a equipe mais precisa ver |
| Funil | Coluna `PERDIDO` com o `data.motivo`; etiqueta `RECUPERAR` já prevista |
| Canais | Exibir `mode` (hospedin / handoff) e `ai_enabled` do heartbeat |
| Campanhas | Cruzar `source_id` do evento `contato.iniciado` com as campanhas da Meta já integradas |

---

## 8. Segurança

| Item | Regra |
|---|---|
| Chave do tenant (Canal A) | Emitida pelo backend por tenant; rotacionável; o bot guarda em configuração, nunca em código |
| Segredo do webhook (Canal B) | Um por tenant; HMAC-SHA256 do corpo bruto; comparação em tempo constante |
| Dados sensíveis | CPF e endereço do hóspede **nunca** saem do bot: ficam no PMS. O evento `ficha.coletada` não existe por isso. O painel recebe nome e telefone |
| `content_preview` | Limitado a 180 caracteres; o texto completo da conversa fica no bot |
| Credenciais do PMS e da Meta | Não trafegam em nenhum canal |

---

## 9. Ambiente e teste

| Ambiente | Bot | Painel |
|---|---|---|
| Desenvolvimento (hoje) | N8N local via ngrok (`https://flakily-scuff-tackle.ngrok-free.dev/webhook/painel`) | Backend local ou de homologação |
| Produção | `https://bot.reservemkt.com.br/webhook/painel` (servidor da RÉSERVE, confirmar quando subir) | Host da API a definir; caminhos sem `/v1`: `/api/ingest/bot-events` e `/api/webhooks/booking/:clientId` |

Canal C, campo `channel`: `direct` (bot e site), `ota:booking` / `ota:airbnb` / `ota:expedia` / `ota:tripadvisor` quando o PMS identificar a OTA, `other` quando o canal do PMS não estiver mapeado (vira `OTHER_OTA` no painel). Piloto: Dona Tereza (`cli_dona_tereza`).

Para testar o Canal A sem o bot, basta enviar um lote com os exemplos da Seção 3.4 (o `event_id` pode ser qualquer UUID). Para o Canal B, o bot aceita chamadas assinadas com o segredo configurado; um `return_to_bot` num número de teste é o teste mais simples.

Dados de teste disponíveis na RÉSERVE: 30 conversas simuladas cobrindo os 9 estágios, transferências, holds expirados e cancelados, grupos e os três públicos.

---

## 10. Checklist de implementação

**Backend**
- [ ] `POST /api/ingest/bot-events` com chave por tenant, lote e idempotência por `event_id`
- [ ] Tabela de eventos (append-only) e projeções: contatos, conversas, funil, métricas, heartbeat
- [ ] Os 6 endpoints da Seção 4 respondendo a partir das projeções
- [ ] Chamada assinada ao webhook reverso nas ações da Seção 5, com evento próprio e job de reconciliação
- [ ] `apply_config` ao aprovar propostas
- [ ] Receber do bot as reservas do PMS em `/webhooks/booking/:clientId` com `engine: hospedin`

**Frontend**
- [ ] `BotContactStatus` com 10 estados e rótulos
- [ ] `chatwootDeepLink` → `whatsappWebLink`
- [ ] Cabeçalho da conversa com ocasião e hold
- [ ] Canais mostrando modo e IA

**Bot (RÉSERVE)**
- [x] WF11 envio ao painel (outbox, lote, retry)
- [x] WF6 webhook reverso (7 ações, HMAC)
- [ ] WF9a chamando `/webhooks/booking/:clientId`
- [ ] Evento `audio.transcrito` (depois do Whisper)
- [ ] `apply_config` para `tarifa:*` e `calendario:*`
