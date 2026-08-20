# MOTOR DE RESERVAS RÉSERVE — ARQUIVO MESTRE

Documento de arquitetura e implementação · v1.0 · Agosto 2026
Destinatário: agente de desenvolvimento (backend + frontend do Painel Reserve)
Cliente piloto: Pousada Dona Tereza (Guapé/MG, 5 tipos, ~8 unidades)

---

## 0. CONTEXTO E DECISÕES JÁ TOMADAS (não rediscutir)

A RÉSERVE está construindo um motor de reservas próprio dentro do Painel Reserve (multi-tenant, Node.js + Postgres já existente). Motivo: os motores nacionais (HSystem, Foco Multimídia) têm API fechada e recusaram integração; o bot de WhatsApp precisa de leitura de disponibilidade, criação de reserva e webhook para operar de forma autônoma.

Decisões fechadas:
1. **O motor da Réserve é a fonte da verdade** de disponibilidade e tarifas.
2. **Beds24 é a ponte para as OTAs** (Booking, Airbnb, Decolar). Ele é Preferred Partner certificado das OTAs; nós nunca falamos com a Booking diretamente. Documentação oficial: wiki.beds24.com, categoria API_V2, guia "PMSs: How to connect to Beds24".
3. **Pagamentos via Asaas** (já integrado no bot): Pix 50% antecipado + 50% no check-in; cartão 100% antecipado. Nenhum dado de cartão passa pelo nosso servidor (PCI escopo SAQ-A).
4. **O Hotel Flow (PMS da pousada) segue como sistema operacional** da recepção. Nosso motor envia reservas confirmadas para ele (via API se disponível — aguardando resposta deles — ou lançamento manual pela gerente).
5. **Venda igual em todos os canais** na v1: sem retenção de unidades por canal.
6. **Sem cupons na v1.** Precificação por temporada + dia de semana cobre o caso atual (fim de semana diária cheia, meio de semana com desconto de ~20%).
7. **Mínimo de noites é atributo do calendário por data** (ex: 7 de setembro com minStay=2). Pacotes/experiências são camada de marketing na memória do bot; o motor só carrega números.
8. **RBAC existente do painel** controla o admin do motor (admin, owner, manager, funcionary). Sem sistema de permissão novo.
9. **O site atual da pousada permanece na HSystem** por enquanto (baixo volume). Regra de coexistência na seção 9.
10. Multi-tenant: TODAS as tabelas com `tenant_id`. O motor nasce para N propriedades.

---

## 1. MODELO DE DADOS (Postgres)

Hierarquia: `room_type` (o que o bot vende) → `unit` (o que o calendário controla) → `rate_plan` → `daily_inventory` (preço/regras por dia) → `reservation`/`hold`/`block`.

```sql
-- Tipo de acomodação (o que aparece para o hóspede)
room_type (
  id, tenant_id,
  nome,                    -- "Suíte Casal"
  descricao_curta,
  capacidade_base int,     -- ocupação incluída no preço
  capacidade_max int,      -- base + adicionais
  valor_pessoa_adicional numeric,  -- por noite (máx. 1 adicional por quarto — regra Dona Tereza)
  aceita_pets bool default false,
  taxa_pet_dia numeric,
  ordem int, ativo bool
)

-- Unidade física (o que é alocado)
unit (
  id, tenant_id, room_type_id,
  identificador,           -- "Casal 01", "Chalé 02"
  ativo bool
)

-- Plano tarifário
rate_plan (
  id, tenant_id, room_type_id,
  nome,                    -- "Tarifa padrão"
  cancellation_policy_id,
  derivado_de int null,    -- rate_plan base (para % futuro)
  percentual_ajuste numeric null,
  ativo bool
)
-- v1: um rate_plan padrão por room_type. Estrutura pronta para não-reembolsável na v2.

-- Política de cancelamento (configurável por tenant — casos e casos)
cancellation_policy (
  id, tenant_id, nome,
  dias_antecedencia_remarcacao int,   -- Dona Tereza: 7
  reembolso_apos_prazo bool,          -- Dona Tereza: false (perde depósito)
  taxa_noshow_percent numeric         -- Dona Tereza: 100
)

-- Temporadas (calendário de precificação)
season (
  id, tenant_id, nome,     -- "Alta — Julho", "Réveillon"
  data_inicio, data_fim,
  prioridade int           -- maior prioridade vence em sobreposição
)

-- Regra de preço (gera o daily_inventory)
price_rule (
  id, tenant_id, room_type_id, rate_plan_id,
  season_id null,          -- null = regra base fora de temporada
  dow_mask int,            -- bitmask dias da semana (seg=1 ... dom=64)
  preco_noite numeric,
  min_stay int default 1
)

-- Calendário diário materializado (a tabela que o bot e o Beds24 leem)
daily_inventory (
  id, tenant_id, room_type_id, data date,
  preco numeric,
  min_stay int,
  closed_arrival bool default false,
  closed_departure bool default false,
  stop_sell bool default false,
  UNIQUE (tenant_id, room_type_id, data)
)
-- Materializada por job a partir das price_rules; editável pontualmente no admin
-- (edição manual grava override e não é sobrescrita pelo job).

-- Reserva
reservation (
  id, tenant_id, room_type_id, unit_id,
  checkin date, checkout date,          -- checkout exclusivo (noites = checkout - checkin)
  status,   -- HOLD | CONFIRMADA | CHECKIN_FEITO | CONCLUIDA | CANCELADA | NOSHOW
  origem,   -- BOT_WHATSAPP | OTA_BOOKING | OTA_AIRBNB | OTA_DECOLAR | SITE_HSYSTEM | MANUAL
  external_id text null,                -- id da reserva no Beds24/OTA
  hospede_nome, hospede_telefone, hospede_email, hospede_doc,
  adultos int, criancas int, pets int,
  valor_total numeric,
  valor_pago numeric default 0,         -- suporta 50/50
  saldo_checkin numeric,                -- a receber na chegada
  forma_pagamento,                      -- PIX_50 | CARTAO_100 | OTA
  asaas_payment_id text null,
  observacoes text,
  atribuicao jsonb null,                -- ctwa_clid, source_id, link_code (cadeia de rastreamento)
  created_at, updated_at
)

-- Eventos da reserva (append-only — auditoria e remarcação)
reservation_event (
  id, reservation_id, tipo,
  -- CRIADA | PAGAMENTO_PARCIAL | CONFIRMADA | REMARCADA | CANCELADA | CHECKIN | CHECKOUT | NOSHOW
  payload jsonb, autor, created_at
)
-- REMARCAÇÃO é operação própria: libera datas antigas, trava novas,
-- mantém valor_pago. Não é cancelar + criar.

-- Hold (pré-reserva durante pagamento)
hold (
  id, tenant_id, room_type_id, unit_id,
  checkin, checkout,
  expires_at timestamptz,   -- cartão: now()+30min · Pix: now()+60min ou vencimento do QR
  contato_whatsapp,
  asaas_payment_id,
  status    -- ATIVO | CONVERTIDO | EXPIRADO | CANCELADO
)

-- Bloqueio manual (manutenção, uso próprio, MENSALISTA)
block (
  id, tenant_id, unit_id,
  data_inicio, data_fim null,   -- null = permanente (caso mensalista)
  motivo,                   -- MANUTENCAO | USO_PROPRIO | MENSALISTA | OUTRO
  criado_por, created_at
)
-- MENSALISTA (regra v5 da Dona Tereza): o chalé do mensalista recebe block
-- PERMANENTE (data_fim null) no seed do onboarding — a API de disponibilidade
-- NUNCA o oferece, mesmo com o mensalista ausente. Aviso de chegada do
-- mensalista = nota operacional para a equipe (evento no feed), não venda.

-- Rate plan "Marina" (regra v5): desconto para cliente da marina vive no motor
-- como rate_plan derivado com percentual_ajuste. O bot apenas identifica o
-- hóspede como cliente da marina (flag na chamada); o preço sai calculado daqui.

-- Estado da sincronização Beds24
channel_sync_state (
  id, tenant_id,
  beds24_property_id, beds24_room_id_map jsonb,  -- room_type_id -> beds24 roomId
  last_push_at, last_webhook_at, last_reconcile_at,
  status    -- OK | DIVERGENTE | ERRO
)
```

### 1.1 A consulta de disponibilidade (o coração — fazer certo)

Disponibilidade de um `room_type` para [checkin, checkout) = existe ao menos UMA `unit` desse tipo **livre em TODAS as noites do período**. Livre = sem reservation ativa (HOLD/CONFIRMADA/CHECKIN_FEITO), sem hold ATIVO não expirado, sem block, e nenhuma data com stop_sell.

⚠️ ERRO CLÁSSICO A EVITAR: contar "vagas por dia" sem amarrar à unidade. Pode haver 1 vaga na segunda e 1 na terça em unidades DIFERENTES — e ninguém consegue dormir as duas noites. A verificação é sempre por unidade contínua no período.

Alocação: ao confirmar, o sistema escolhe a unidade que **minimiza fragmentação** do calendário (best-fit: a unidade cujo gap livre mais justo comporta a estadia).

### 1.2 Concorrência do hold (trava no banco, não na aplicação)

Duas pessoas fechando o último quarto no mesmo segundo é resolvido pelo Postgres, nunca pelo N8N:

```sql
-- Na criação do hold, dentro de uma transação:
-- constraint de exclusão por período na unidade (extensão btree_gist)
ALTER TABLE hold ADD CONSTRAINT hold_no_overlap
  EXCLUDE USING gist (
    unit_id WITH =,
    daterange(checkin, checkout) WITH &&
  ) WHERE (status = 'ATIVO');
-- Mesma constraint em reservation para status ativos.
```

Fluxo: hóspede confirma → `SELECT ... FOR UPDATE` das units candidatas → tenta INSERT do hold na melhor unidade → se a constraint estourar (outra transação ganhou), tenta a próxima unidade do tipo → se nenhuma sobrar, responde ao bot "tipo esgotado". O segundo hóspede recebe do bot: "esse quarto acabou de entrar em processo de reserva por outro hóspede; me avisa se quiser que eu veja outra opção ou te aviso se ele liberar."

Expiração: job por minuto marca holds vencidos como EXPIRADO → dispara evento ao bot → bot envia: "Não identificamos o pagamento e a pré-reserva foi liberada, pois outros hóspedes podem reservar essas datas. Quer que eu gere um novo link?" → follow-up de pagamento já existente no cérebro do bot assume.

---

## 2. API INTERNA (consumida pelo bot via N8N e pelo Painel)

Autenticação: chave por tenant (mesmo padrão da API de ingestão de eventos do bot já planejada). Todas as respostas incluem `request_id`.

```
GET  /api/motor/availability
     ?checkin=2026-09-05&checkout=2026-09-07&adultos=2&criancas=0&pets=0
     → retorna TODOS os room_types com vaga no período: preço por noite,
       total calculado (base + pessoa adicional + taxa pet), min_stay,
       unidades_livres, capacidade_base e capacidade_max
     -- Divisão de responsabilidade da ALOCAÇÃO INTELIGENTE:
     -- · O MOTOR é a autoridade de capacidade e preço: capacidade_max = base+1
     --   (limite de 1 pessoa adicional vive AQUI, não no prompt). Um hold que
     --   exceda a capacidade é rejeitado pela API, mesmo que a IA sugira.
     -- · O BOT compõe grupos: para 2 casais, ele monta "2× Suíte Casal" a partir
     --   da MESMA resposta (unidades_livres ≥ 2), sem chamadas extras. A
     --   inteligência de composição/recomendação permanece no prompt; os números
     --   vêm sempre desta resposta.

POST /api/motor/holds
     { room_type_id, checkin, checkout, adultos, criancas, pets,
       contato_whatsapp, forma_pagamento, cliente_marina bool }
     → { hold_id, unit_id, expires_at, valor_total, valor_antecipado }
     → 409 se tipo esgotado (bot trata com mensagem de esgotado
       e SEMPRE refaz GET /availability antes de oferecer alternativa)
     -- forma_pagamento: PIX_LINK (60min) | CARTAO (30min) | PIX_MANUAL (120min,
     --    confirmação humana via painel/Chatwoot — o Pix manual TAMBÉM cria hold,
     --    senão reabre o overbooking que o motor existe para matar)
     -- cliente_marina=true aplica o rate_plan "Marina" (desconto configurado
     --    no motor — o bot NUNCA calcula desconto por conta própria)

POST /api/motor/holds/:id/confirm      -- chamado pelo webhook Asaas (pago)
     → converte hold em reservation CONFIRMADA, grava valor_pago,
       dispara push de disponibilidade ao Beds24 e evento ao Hotel Flow/feed

-- PAGAMENTO TARDIO (pago após o hold expirar):
-- o confirm de um hold EXPIRADO tenta recriar o hold nas mesmas datas/tipo.
-- Sucesso → confirma normalmente (hóspede nem percebe).
-- 409 (datas vendidas no intervalo) → cria pending_payment_exception,
-- alerta PRIORITÁRIO à equipe (dinheiro recebido sem reserva) e retorna
-- o estado ao bot para fluxo de exceção com transferência imediata.
-- Resolução humana: remarcar datas ou estornar via painel.

POST /api/motor/holds/:id/release      -- expiração ou desistência
POST /api/motor/reservations/:id/reschedule   { novo_checkin, novo_checkout }
POST /api/motor/reservations/:id/cancel        { motivo }
     → aplica cancellation_policy (>=7 dias: crédito p/ remarcação;
       <7 dias: sem reembolso; registra em reservation_event)
GET  /api/motor/reservations?periodo&status&origem
GET  /api/motor/calendar?mes=2026-09      -- mapa para o admin (grid unidade × dia)
POST /api/motor/blocks                    -- bloqueio manual / mensalista
```

Webhook Asaas (já existente no bot): pagamento confirmado → `confirm`; pagamento vencido/negado → `release`. Idempotência por `asaas_payment_id`.

---

## 3. INTEGRAÇÃO BEDS24 (a ponte OTA)

Referências oficiais: `api.beds24.com/v2` (Swagger interativo) · wiki.beds24.com → "PMSs: How to connect to Beds24 via API V2" (Booking.com e Airbnb têm guias próprios).

### 3.1 Autenticação
Invite code gerado no painel Beds24 (Settings > Account > Access) → `GET /authentication/setup` troca por **refresh token** de longa duração → `GET /authentication/token` gera **access tokens** curtos. Tokens com escopo de permissão e IP whitelisting opcional. Guardar refresh token cifrado por tenant.

### 3.2 Rate limit (IMPORTANTE para o desenho)
Créditos por conta em janela móvel de 5 minutos. Regras de implementação:
- **Atualizações em LOTE**: um `POST /inventory/rooms/calendar` cobre ranges de datas por quarto — nunca uma chamada por dia.
- Cache local do calendário (ler 1 ano de uma vez, como a doc recomenda).
- Fila de push com debounce: várias mudanças em 30s viram um push só.
- Retry com backoff exponencial em 429.

### 3.3 O que NÓS empurramos (motor → Beds24)
```
POST /inventory/rooms/calendar
[ { "roomId": <beds24RoomId>,
    "calendar": [ { "from": "2026-09-05", "to": "2026-09-07",
                    "numAvail": 1, "price1": 339.00, "minStay": 2 } ] } ]
```
Gatilhos de push: reserva confirmada/cancelada/remarcada no motor · hold criado/expirado (numAvail reflete holds ativos) · mudança de preço/regra no admin · block criado/removido.

### 3.4 O que RECEBEMOS (Beds24 → motor)
- **Booking webhooks** (ativar em Settings > Properties > Access > Booking webhooks): chegam com o **JSON completo da reserva no corpo** — na maioria dos casos sem chamada adicional. Criação, alteração e cancelamento vindos de qualquer OTA.
- Handler: valida assinatura/origem → upsert em `reservation` com `origem=OTA_*` e `external_id` → decrementa disponibilidade → push atualizado para os DEMAIS canais → evento para o Painel (funil/feed) e para o fluxo Hotel Flow.
- Idempotência por `external_id + updated_at`.

### 3.5 Reconciliação (cinto de segurança)
Job diário (madrugada): `GET /bookings?modifiedSince=<último sync>` por propriedade → compara com `reservation` local → divergência = corrige local + alerta interno (canal da equipe Réserve) + marca `channel_sync_state.status=DIVERGENTE` até resolução. Webhook é o caminho normal; reconciliação garante que webhook perdido não vira overbooking.

### 3.6 Limitações conhecidas (não descobrir na prática)
- **Mapeamento Booking.com NÃO é via API**: room mapping é feito uma única vez no painel do Beds24, manualmente, no onboarding de cada propriedade (~uma tarde por cliente).
- Airbnb: ao conectar via API, o Airbnb envia as reservas futuras; mensageria do Airbnb disponível via API (recurso futuro interessante para o bot).
- White label disponível (operar sem o cliente ver o Beds24) — avaliar na escala.

---

## 4. PAGAMENTOS (Asaas — módulo já existente no bot)

| Forma | Regra | No motor |
|---|---|---|
| Pix | 50% antecipado confirma; 50% no check-in | `valor_pago=50%`, `saldo_checkin=50%`; alerta à equipe no dia do check-in com o saldo |
| Cartão | 100% antecipado (link Asaas, parcelável) | `valor_pago=100%`, `saldo_checkin=0` |
| OTA | Cobrança pela OTA | `forma_pagamento=OTA`, financeiro fora do motor |

Hold: cartão 30 min · Pix 60 min (ou vencimento do QR, o que vier primeiro). Configurável por tenant em `tenant_settings`.

Cancelamento (política Dona Tereza, configurável): ≥7 dias de antecedência → crédito para remarcação (não reembolso automático); <7 dias → perde antecipação; no-show → 100%. Reembolso via Asaas quando aplicável é ação manual do admin na v1 (botão "processar reembolso" chama API Asaas).

---

## 5. ADMIN DO MOTOR NO PAINEL (frontend)

Rotas novas no Painel Reserve (RBAC existente; `admin` e `owner` full, `manager` opera reservas/bloqueios, `funcionary` leitura):

```
/motor/calendario      → MAPA: grid unidade × dia (mês). Cores por estado:
                          livre / hold / confirmada / OTA / block / mensalista.
                          Clique em célula: criar bloqueio ou reserva manual.
                          Mobile: lista por dia. Design system RÉSERVE.
/motor/tarifas         → temporadas, price_rules (dow + preço + minStay),
                          edição pontual de datas no daily_inventory
/motor/reservas        → lista + detalhe (pagamentos, eventos, remarcar/cancelar)
/motor/acomodacoes     → room_types e units (CRUD)
/motor/canais          → estado da sincronização Beds24 (last_push, last_webhook,
                          última reconciliação, status), alertas de divergência
```

Regras de UI: mapa legível em 5 segundos pela gerente da pousada · toda ação destrutiva com confirmação · glossário zero jargão (padrão do Painel) · o bloqueio de mensalista tem atalho próprio (perfil já existente no bot v5).

---

## 6. INTEGRAÇÃO COM O BOT (o que muda no cérebro dele)

O QUE SAI da memória do bot: toda a tabela de preços por acomodação e regras de valor por data. 
O QUE ENTRA: chamadas de ferramenta à API do motor.

Fluxo novo da conversa de reserva:
1. Hóspede indica datas/pessoas → bot chama `GET /availability` → apresenta APENAS tipos disponíveis com preço real calculado (fim da regra "nunca afirmar disponibilidade": agora ele PODE afirmar, porque a fonte é o motor).
2. Hóspede escolhe → bot chama `POST /holds` → informa que as datas ficaram reservadas por X minutos e envia link Asaas.
3. Webhook Asaas confirma → motor confirma → bot envia confirmação com resumo (e o motor já propagou ao Beds24 e ao fluxo Hotel Flow).
4. Hold expira → motor avisa o bot → mensagem de liberação + oferta de novo link (follow-up de pagamento existente assume).
5. Tipo esgotado na criação do hold (corrida) → mensagem de esgotado + alternativa.

Permanecem na memória do bot: tom de voz, experiências, pacotes como narrativa (o minStay/preço do pacote vive no calendário), políticas em linguagem humana, gatilhos de transferência, pagamento manual (Pix direto com a Wendy) como fallback — **agora com hold PIX_MANUAL de 120 min criado antes de passar a chave**.

Regras adicionais fechadas com o time do bot:
- **MODO DUAL com flag (`motor_mode: off|on` por tenant):** o bot é construído com os dois comportamentos desde o início. `off` = modo atual (nunca afirma disponibilidade, handoff). `on` = fluxo com motor. A virada do cutover é trocar a flag, não reescrever prompt/workflow.
- **409 obriga refresh:** após qualquer 409 no hold, o bot refaz `GET /availability` antes de oferecer alternativa — a oferta anterior está desatualizada por definição.
- **Cancelar ≠ estornar:** `/cancel` libera datas e registra o evento; estorno financeiro no Asaas é ação manual da equipe pelo painel. O bot comunica: "sua reserva foi cancelada; sobre valores pagos, nossa equipe entra em contato para os próximos passos." Nunca promete reembolso automático.
- **Migração dos slots de memória (v5):** SLOT 2 (acomodações/preços), SLOT 4 (regras de alocação com valores) e a parte de valores do SLOT 6 (pacotes) migram para a configuração do motor — fonte única. Os slots permanecem no prompt apenas com a camada descritiva/narrativa, com a anotação "valores: ver motor".
- **Atribuição:** ctwa_clid, source_id e link_code viram campos na tabela `contatos` do bot, capturados no primeiro contato e carregados até `reserva.confirmada`.
- **Recepção de eventos do motor:** novo workflow no N8N (WF9) recebe `hold.expirado`, `pagamento.tardio.exception` e `reserva.confirmada_ota`, com as transições de estado correspondentes (AGUARDANDO_PAGAMENTO ganha hold_id + expires_at; expiração retorna o contato a ATIVO com a mensagem de liberação).

---

## 7. INTEGRAÇÃO HOTEL FLOW (PMS da pousada) — [A CONFIRMAR]

Aguardando resposta do hotelflow sobre API para origem adicional de reservas.
- **Se houver API**: toda reserva CONFIRMADA/alterada/cancelada no motor é enviada ao hotelflow (fila + retry, mesmo padrão da ingestão de eventos do bot).
- **Se não houver**: notificação automática no WhatsApp da equipe interna (fluxo de equipe já existe no bot v5): "Nova reserva: [tipo], [datas], [hóspede], saldo no check-in R$X — lançar no hotelflow." A gerente lança manualmente. Volume da pousada torna isso operável.
- O hotelflow segue integrado à HSystem para o que já faz hoje; nós somos origem ADICIONAL.

---

## 8. RASTREAMENTO (liga com o Painel Reserve já planejado)

Toda reserva de origem BOT_WHATSAPP carrega `atribuicao` (ctwa_clid, source_id, link_code — cadeia já especificada no plano do Painel). Isso alimenta o ROI Nível 3 do Painel: receita real por campanha, ROAS, ticket médio — agora com dados do NOSSO motor, sem depender de webhook de terceiro.

---

## 9. CUTOVER DONA TEREZA (ordem exata da virada)

Pré-requisitos: motor em produção testado · conta Beds24 criada e propriedade configurada · mapeamento manual Booking feito · Airbnb conectado · bot integrado ao motor em ambiente de teste.

1. **Congelar referência**: exportar do HBOOK todas as reservas futuras (diretas + OTA) — planilha ou tela, o que a HSystem der.
2. **Importar** as reservas futuras no motor (origem SITE_HSYSTEM/MANUAL, com unidade alocada).
3. **Conectar canais ao Beds24**: Airbnb envia futuras automaticamente na conexão; Booking — importar/conferir contra o export do passo 1. ⚠️ As reservas DIRETAS do HBOOK não vêm por canal nenhum — só pelo passo 2.
4. **Conferência tripla**: motor × export HBOOK × extranets (Booking/Airbnb). Zero divergência antes de prosseguir.
5. **Desconectar as OTAs do HUNIT** (a pousada solicita à HSystem) no mesmo momento em que o Beds24 assume — nunca os dois channel managers ativos nas mesmas OTAs.
6. **Virar o bot** para o motor (flag de ambiente).
7. **Regra de coexistência do site** (enquanto o site HSystem existir): o site continua vendendo pelo HBOOK com calendário próprio → TODA reserva do site é cadastrada no motor NO MESMO DIA pela gerente (alerta/rotina combinada) e, em ocupação alta, fechar datas manualmente no HBOOK. Janela de risco documentada e aceita pelo cliente por escrito. Encerramento definitivo na entrega do site novo (próximo contrato).
8. **Monitoramento reforçado 14 dias**: reconciliação 2×/dia, alerta de divergência imediato.

Rollback: enquanto o passo 5 não acontece, tudo é reversível (bot volta ao modo handoff, HUNIT segue nas OTAs).

---

## 10. FASEAMENTO DE DESENVOLVIMENTO

**Fase 1 — Núcleo do motor (destrava o bot autônomo em reserva direta)**
Modelo de dados completo · availability + holds com constraint de exclusão · confirm/release via webhook Asaas · reservas manuais e blocks · mapa admin básico · API do bot · remarcação/cancelamento com política.

**Fase 2 — Beds24**
Auth + cache de calendário · push em lote com debounce · booking webhooks · reconciliação diária · tela /motor/canais · conta demo (trial) com propriedade de teste ANTES da real.

**Fase 3 — Cutover Dona Tereza** (seção 9) + integração Hotel Flow (conforme resposta) + eventos para o funil/feed do Painel.

**Fase 4 — Produto**
Tarifas derivadas (não-reembolsável com desconto) · cupons · widget de site (o "reserve agora" do site novo) · white label Beds24 · relatório de receita por canal no bloco ROI do Painel.

---

## 11. RISCOS E REGRAS INEGOCIÁVEIS

| Risco | Regra |
|---|---|
| Overbooking (CDC: responsabilidade objetiva) | Constraint de exclusão no banco · push imediato ao Beds24 em toda mudança · reconciliação diária · regra de coexistência do site por escrito · cláusula de limitação de responsabilidade no contrato do serviço |
| Dois channel managers nas mesmas OTAs | NUNCA. HUNIT sai no mesmo ato em que Beds24 entra (cutover passo 5) |
| Rate limit Beds24 | Lote + debounce + cache + backoff. Nunca chamada por dia de calendário |
| Webhook perdido | Reconciliação diária corrige; divergência gera alerta interno |
| Hold prendendo estoque | Expiração por job a cada minuto; numAvail empurrado ao Beds24 considera holds |
| Bot afirmando o que não sabe | Ele só afirma o que a API do motor respondeu; erro/timeout da API → fallback: "vou confirmar com a equipe" + handoff |
| LGPD | Dados de hóspede escopados por tenant, retenção configurável, Asaas e Beds24 como operadores documentados |
| Beds24 fora do ar | Venda direta continua (motor é local); push entra na fila e sincroniza ao voltar |

---

## 12. PENDÊNCIAS EXTERNAS

| Item | Status |
|---|---|
| Resposta do hotelflow (API de origem adicional) | Aguardando |
| Resposta da Bukly (call 27/08 — opção comparativa, não bloqueia) | Aguardando |
| Beds24: criar conta trial, propriedade de teste, validar suporte/pagamento BR | Próximo passo (Gabriel) |
| Confirmar com a Débora: rotina de cadastro das reservas do site + aceite por escrito da regra de coexistência | Reunião |
| Export das reservas futuras do HBOOK (pedir à HSystem/Débora) | Antes do cutover |

---

*RÉSERVE — Ecossistema de Aquisição de Hóspedes · Motor de Reservas · Arquivo Mestre v1.0*
