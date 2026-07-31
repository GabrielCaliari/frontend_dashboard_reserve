# PLANO MESTRE — PAINEL RESERVE

**Portal de Resultados para Clientes de Hotelaria**
Documento de alinhamento completo · Backend + Frontend · v2.0 · Julho 2026

> **v2.0 — o que mudou:** adicionado o módulo completo de Automação de Atendimento WhatsApp (seção 5), a cadeia de rastreamento ponta a ponta anúncio → reserva (seção 6), o calendário semestral (3.11), o benchmark interno da agência (seção 7) e a arquitetura de integração bot ↔ painel via API de eventos (5.6).
> **v1.1:** bloco de Análise de ROI e digest automático quinzenal, a partir do benchmark do Kommo.

---

## 1. VISÃO E POSICIONAMENTO

### 1.1 O que é

O **Painel Reserve** é o portal onde cada cliente (hotel/pousada) acompanha em tempo real:

- Onde o dinheiro dele está sendo investido (tráfego pago)
- O que está voltando disso (cliques, conversas, leads, engajamento)
- Como o atendimento automatizado está performando (funil do bot, conversas, conversões)
- O que a Reserve está fazendo pelo negócio dele (feed de atividades, calendário de conteúdo, plano semestral)
- A evolução desde a entrada da Reserve (linha do tempo com marco zero)

### 1.2 O que NÃO é — e por que isso importa

**Não é um CRM.** CRM é gestão de relacionamento com hóspedes (contatos, histórico de estadias, funil comercial do hotel) — isso é entrega de motor de reserva/PMS, não de agência de marketing. Se vendermos como "CRM", criamos a expectativa errada e o cliente vai cobrar gestão de contatos depois.

**Nomenclatura oficial:** "Painel Reserve" ou "Portal do Cliente Reserve".
**Pitch comercial:** *"Acompanhamento em tempo real dos seus resultados — você vê exatamente onde cada real investido está indo e o que está voltando."*

> Nota sobre o funil do bot: o painel exibe um funil de atendimento (novo → qualificado → pagamento → fechado). Isso **não** o transforma em CRM — é a medição do nosso próprio processo de aquisição, não a gestão da base de hóspedes do hotel. A fronteira está na seção 1.4.

### 1.3 Papel de cada ferramenta

| Ferramenta | Papel | Quem vê |
|---|---|---|
| **Trello** | Workflow interno: onboarding, briefing, calendário editorial interno, aprovações | Só a Reserve |
| **Chatwoot** | Interface humana de atendimento — fonte única da verdade para responder | Equipe do hotel + Reserve |
| **Painel Reserve** | Janela única do cliente: métricas, funil, conversas (leitura), atividades, relatórios | Cliente + Reserve |
| **PDF** | Exportação sob demanda a partir do painel (deixa de ser montado manualmente) | Cliente encaminha para sócios/contador |

### 1.4 Fronteira de responsabilidade (princípio inegociável)

O painel materializa a fronteira que já defendemos verbalmente:

- **Reserve entrega:** demanda qualificada — cliques, conversas iniciadas, leads gerados, leads prontos para fechar (evento `[TRANSFERIR]` do bot).
- **Hotel converte:** reservas fechadas são responsabilidade do atendimento do hotel.

O painel torna essa fronteira **visível com dados**: o funil mostra onde a Reserve termina e onde o hotel começa. Se há muitos leads prontos e poucas reservas, o gargalo aparece no gráfico — sem discurso, sem atrito.

---

## 2. DECISÕES FECHADAS (alinhamento consolidado)

| # | Decisão | Definição |
|---|---|---|
| 1 | **Cadência de dados** | Granularidade diária · comparativo destacado quinzenal (casando com o resumo narrado) · visão mensal de fechamento. Semanal descartado (ruído de oscilação normal de campanha). |
| 2 | **Níveis de acesso** | Já implementado: `admin`, `owner`, `manager`, `funcionary`. Reaproveitar RBAC existente. |
| 3 | **Metas** | Configurável por cliente e por métrica (flag `showGoal`). Default: exibir meta apenas para leads de WhatsApp. Demais métricas: meta oculta, só realizado. |
| 4 | **Domínio** | `portal.reservemkt.com.br` com identidade RÉSERVE (PP Hatton, tom quiet luxury da marca). |
| 5 | **Notificações** | Sistema já existe (email de lead novo). Estender para: publicação de resumo quinzenal, novo relatório, marco atingido. Canal futuro: WhatsApp via Meta Cloud API. |
| 6 | **Histórico retroativo** | Importar meses anteriores à entrada da Reserve no onboarding. Estabelece o "antes vs. depois". |
| 7 | **Feed de atividades** | Confirmado, com calendário de conteúdo integrado. |
| 8 | **Glossário** | Confirmado. Tooltip "?" em cada métrica, linguagem de dono de pousada. |
| 9 | **Onboarding** | A Reserve configura tudo (OAuth, conexões, metas). Cliente não configura nada. |
| 10 | **Mobile-first** | Prioridade absoluta. |
| 11 | **Conversas no painel = leitura** | O painel exibe histórico, busca e métricas das conversas. **Responder acontece no Chatwoot**, via deep link. Fonte única da verdade para atendimento — evita bot preso em PAUSADO e estado dessincronizado. |
| 12 | **Estado do funil = log de eventos** | Tabela `funil_eventos` append-only com autor (`bot` ou `humano`), timestamp e motivo. Estado atual = último evento. Permite o cliente mover o card sem quebrar o bot, preserva auditoria e habilita a métrica de tempo médio por estágio. |
| 13 | **Cliente edita dados, não comportamento** | Cliente pode propor alteração de preços, políticas, pacotes e encantamento. **Nunca** edita o system prompt nem as regras de comportamento. Toda alteração passa por aprovação da Reserve antes de publicar. |
| 14 | **Integração bot ↔ painel via API de eventos** | O N8N dispara eventos para `POST /api/ingest/bot-events` com chave por tenant. O painel nunca alcança o banco do bot. Idempotência por `event_id`, fila de retry no N8N. |
| 15 | **Atribuição por `ctwa_clid` + `source_id`** | Persistir os campos do objeto `referral` do webhook da Meta (hoje descartados após decidir a janela). É o que permite ROI por campanha. |
| 16 | **Benchmark de agência só após piso estatístico** | Coleta começa já. Uso público apenas com **≥5 clientes e ≥6 meses** de dados. Até lá, caso a caso, nominal e com autorização do cliente. |

---

## 3. BLOCOS DO PAINEL (frontend do cliente)

### 3.1 Bloco: Visão Geral (home)

Primeira tela após login. Responde em 10 segundos: *"está indo bem?"*

- **4 cards de destaque** (mobile: empilhados):
  - Investimento no período (R$)
  - Conversas iniciadas
  - Custo por conversa
  - Variação vs. quinzena anterior (% com seta e cor)
- **1 gráfico principal:** conversas por dia (últimos 30 dias)
- **Último resumo narrado** (card com preview)
- **Feed de atividades recentes** (últimas 5)

Regra de ouro: nenhum jargão nesta tela. "Conversas iniciadas no WhatsApp", não "CTWA clicks".

### 3.2 Bloco: Tráfego Pago

Fonte: Meta Ads sync (já existe) + Google Ads (OAuth pendente).

| Métrica | Nome no painel | Tooltip do glossário |
|---|---|---|
| Spend | Investimento | "Quanto foi investido em anúncios neste período" |
| Reach | Pessoas alcançadas | "Quantas pessoas diferentes viram seus anúncios" |
| Impressions | Visualizações | "Quantas vezes seus anúncios apareceram" |
| Clicks / CTWA | Conversas iniciadas | "Quantas pessoas clicaram e abriram conversa no WhatsApp" |
| CPL | Custo por conversa | "Quanto custou, em média, cada pessoa que chamou no WhatsApp" |
| Frequency | Frequência | "Quantas vezes, em média, cada pessoa viu o anúncio" |

**Visualizações:** linha diária de investimento vs. conversas · comparativo quinzenal em barras · desempenho por campanha (tabela; no mobile, cards empilhados).

**Novidade da v2.0:** com a atribuição por `source_id`, a tabela por campanha passa a mostrar não só cliques, mas **quantas conversas e quantos leads qualificados cada campanha gerou** (ver seção 6).

### 3.3 Bloco: Leads e Funil

Estrutura em camadas — resolve o cliente sem motor de reservas:

```
CAMADA 1 — sempre presente (dado 100% da Reserve):
  Cliques nos links rastreáveis → conversas iniciadas → leads gerados
  Breakdown: por dia, por dispositivo, por cidade/região

CAMADA 2 — quando o bot estiver ativo:
  Funil completo: NOVO → QUALIFICADO → PAGAMENTO → FECHADO (+ FRIO)
  Leads prontos para fechar (evento [TRANSFERIR])
  → métrica mais honesta da fronteira

CAMADA 3 — quando houver motor de reservas integrado (webhook):
  Reservas confirmadas + receita → bônus, não fundação

CAMADA 3-alternativa — cliente sem motor:
  Bloco de reservas NÃO aparece por padrão.
  Opcional: campo preenchido PELO CLIENTE, com selo "dado informado pelo hotel".
  A Reserve nunca corre atrás desse número.
```

**Funil visual:** `Alcance → Cliques → Conversas → Qualificados → Prontos para fechar [fronteira Reserve] → Reservas [hotel]`. A linha da fronteira é desenhada explicitamente no gráfico.

### 3.4 Bloco: Instagram Orgânico

Fonte: **Instagram Graph API** (a construir). Mesma infraestrutura OAuth da Meta já usada para Ads.

- Seguidores (total + crescimento no período)
- Alcance orgânico
- Engajamento (curtidas + comentários + salvamentos + compartilhamentos)
- Taxa de engajamento
- Top 3 posts do período

**Endpoints relevantes:**
- `GET /{ig-user-id}?fields=followers_count,media_count`
- `GET /{ig-user-id}/insights?metric=reach,accounts_engaged,total_interactions&period=day`
- `GET /{ig-user-id}/media?fields=id,caption,media_url,like_count,comments_count,timestamp`

### 3.5 Bloco: Calendário de Conteúdo + Feed de Atividades

**Objetivo:** matar a pergunta recorrente "cadê o post?" e mostrar trabalho contínuo.

**Calendário de conteúdo:**
- Visão mensal (mobile: lista por semana) com posts agendados e publicados
- Fonte primária: Meta Graph API — `scheduled_posts` (Páginas) e Content Publishing API (Instagram)
- ⚠️ **Validar na prática:** posts agendados dentro do Meta Business Suite podem não ser expostos integralmente pela API. Spike técnico na Fase 2 com a conta da Pousada Dona Tereza.
- **Fallback garantido:** agendamento registrado no nosso sistema (data, thumbnail, status). Vantagem: controle total, sem dependência da Meta. Pode inclusive ser o modelo padrão, com a API só confirmando a publicação.
- Estados: `Em produção` · `Agendado` · `Publicado` (com link)

**Feed de atividades:**
- Timeline reversa de tudo que a Reserve fez
- Eventos automáticos: publicação de post, publicação de relatório, ajuste de campanha, alteração aprovada no bot
- Eventos manuais: registro rápido pelo admin ("Reunião de alinhamento realizada", "Sessão de fotos agendada")
- Backend: tabela `activity_log`

### 3.6 Bloco: Linha do Tempo / Antes e Depois

- **Marco zero:** data de entrada da Reserve, destacada em todos os gráficos de longo prazo
- **Baseline retroativa:** métricas dos meses anteriores, importadas no onboarding (Meta Ads Insights cobre até 37 meses)
- **Instagram:** `followers_count` não tem histórico via API → registrar snapshot no dia do onboarding como baseline + registros que o cliente tiver
- **Marcos:** "10.000 seguidores", "Primeira campanha no ar", "Bot ativado", "Recorde de conversas"
- **Seção "Planos futuros":** lista curta editável pelo admin

### 3.7 Bloco: Relatórios (resumo narrado quinzenal)

Reaproveitar o módulo de relatórios existente (rascunho → publicação), com cadência quinzenal.

**Estrutura fixa (3-4 parágrafos, linguagem didática):**
1. O que aconteceu no período (números-chave em uma frase)
2. Por que aconteceu (contexto: sazonalidade, mudança de criativo)
3. O que faremos no próximo ciclo
4. (Opcional) Um destaque ou aprendizado

**Tom:** mesmo padrão da marca — direto, sem jargão, sem adjetivo vago. O resumo transforma dado em autoridade.

### 3.7.1 Digest automático quinzenal (push de resultado)

**Princípio:** o cliente não deve precisar logar para saber como foi a quinzena.

1. Job agendado (dia 1 e dia 16) monta o digest por tenant
2. Conteúdo automático: investimento, conversas, custo por conversa, variação % de cada, posts publicados no período
3. O job **não publica sozinho** — gera o rascunho com os números prontos, a Reserve escreve a narrativa e publica. **Automação monta, humano assina.**
4. Envio: email (`reserve-mailer`) com os números no corpo + CTA para o painel · WhatsApp na Fase 6 via template aprovado

**Regra de conteúdo:** os números principais vão no corpo do email, não só no link. Se o cliente ler apenas o email, ele já recebeu o resultado.

### 3.8 Exportação PDF

- Botão "Exportar período" em cada bloco e "Exportar relatório completo" na home
- Geração server-side a partir dos mesmos dados (rota `/print` renderizada por Puppeteer/Playwright, ou lib de PDF no backend)
- Cabeçalho com marca RÉSERVE + nome do hotel + período
- Elimina a montagem manual de PDF

### 3.9 Bloco: Análise de Retorno (ROI)

**Comportamento em camadas:**

```
NÍVEL 1 — todo cliente:
  · Investimento total no período
  · Conversas geradas
  · Custo por conversa
  · Evolução do custo por conversa ao longo do tempo
  · Comparação com o próprio histórico do cliente

NÍVEL 2 — cliente com bot ativo:
  · Custo por lead qualificado
  · Custo por lead pronto para fechar (investimento ÷ eventos [TRANSFERIR])
  · Taxa de qualificação (qualificados ÷ conversas)
  · ROI por campanha (via source_id — ver seção 6)

NÍVEL 3 — cliente com motor de reservas integrado:
  · Receita atribuída · ROAS · Ticket médio
  · Taxa de conversão lead → reserva  [fronteira: responsabilidade do hotel]
```

**Regras inegociáveis:**
- **Nunca estimar receita.** Cliente sem motor não vê ROAS — vê eficiência de aquisição.
- **Atribuição declarada.** Janela explícita e visível no painel (ex: "reservas de leads originados em até 30 dias").
- **Custo por conversa em queda é positivo.** Inverter a lógica de cor nessa métrica.
- **Não comparar com "média de mercado"** enquanto não houver base própria válida (ver seção 7).

**Valor comercial secundário:** o Nível 3 só existe com motor integrado — o bloco aparece bloqueado com explicação, virando argumento natural de upsell.

### 3.10 Bloco: Automação de Atendimento WhatsApp

Ver seção 5 — módulo completo.

### 3.11 Bloco: Plano Semestral

**Objetivo:** dar direção, não só retrovisor. O cliente vê onde está dentro de um plano de seis meses combinado.

**Estrutura:**
- **Eixos estratégicos** do semestre (ex: aquisição direta, autoridade de marca, automação de atendimento)
- **Entregas por mês** com status (`planejado` · `em andamento` · `concluído`)
- **Marcos vinculados** — quando uma entrega conclui, gera evento no feed de atividades e, se relevante, um marco na linha do tempo
- **Visão:** timeline horizontal no desktop, lista vertical por mês no mobile

**Backend:** tabela `plano_semestral` + `plano_entregas`. Editável apenas por `admin`. O cliente visualiza e comenta (comentário opcional — avaliar na Fase 5).

**Por que importa comercialmente:** responde "o que vem por aí?" antes do cliente perguntar. Reduz ansiedade de contrato e sustenta renovação.

---

## 4. ARQUITETURA TÉCNICA (painel)

### 4.1 Backend — o que já existe vs. o que construir

**JÁ EXISTE (reaproveitar):**
- Multi-tenant com RBAC (`admin`, `owner`, `manager`, `funcionary`)
- Meta Ads + Google Ads sync agendado · GA4 integrado
- Links rastreáveis WhatsApp (cliques, geo, dispositivo, stats 30 dias)
- Webhooks de motores de reserva (Omnibees, Stays, Foco, HITS, TOTVS)
- Relatórios com rascunho/publicação · Notificações por tenant · Email marketing com tracking
- Booking window automático · Paridade de tarifas (manual) · Orçamento por canal

**CONSTRUIR:**

| Item | Descrição | Complexidade |
|---|---|---|
| API de ingestão de eventos do bot | `POST /api/ingest/bot-events` com chave por tenant e idempotência | Média |
| Módulo de automação WhatsApp (seção 5) | Funil, conversas, configuração, métricas | Alta |
| Cadeia de atribuição (seção 6) | Persistência de `ctwa_clid`/`source_id` + código no link rastreável | Média |
| Instagram Graph API sync | OAuth + sync diário de insights e media | Média |
| Snapshot diário de seguidores | Cron (API não dá histórico) | Baixa |
| Comparativo período vs. período | Service de variação % para qualquer métrica | Baixa-média |
| `activity_log` | Tabela + CRUD + eventos automáticos | Baixa |
| Calendário de conteúdo | `content_posts` + spike da Meta scheduled posts | Média |
| Marcos e linha do tempo | `milestones` + marco zero no tenant | Baixa |
| Metas configuráveis | `metric_goals` com `show_goal` | Baixa |
| Plano semestral | `plano_semestral` + `plano_entregas` | Baixa |
| Baseline retroativa | Job de importação histórica no onboarding | Média |
| Export PDF | Rota de geração server-side | Média |
| Benchmark agregado da agência | Job de agregação anonimizada + regra de piso | Média |

### 4.2 Modelo de dados — painel (novas tabelas)

```
activity_log
  id · tenant_id · type (auto|manual) · category (post|campaign|report|bot|meeting|other)
  title · description · icon · created_by · created_at

content_posts
  id · tenant_id · platform (instagram|facebook) · scheduled_for · published_at
  status (draft|scheduled|published) · caption_preview · thumbnail_url
  external_id · permalink

milestones
  id · tenant_id · date · title · type (marco_zero|seguidor|campanha|bot|recorde|custom)

metric_goals
  id · tenant_id · metric_key · period (biweekly|monthly) · target_value · show_goal

ig_daily_snapshot
  id · tenant_id · date · followers_count · reach · engaged_accounts · total_interactions

future_plans
  id · tenant_id · title · description · order · status

digest_runs
  id · tenant_id · period_start · period_end · status (gerado|publicado)
  metrics_payload (json) · report_id · generated_at · published_at

attribution_settings
  id · tenant_id · window_days (default 30) · source_priority

plano_semestral
  id · tenant_id · semestre · titulo · eixos (json) · criado_por · criado_em

plano_entregas
  id · plano_id · mes · titulo · descricao · status (planejado|em_andamento|concluido)
  milestone_id (nullable) · ordem
```

### 4.3 Frontend (portal do cliente)

**Stack:** Next.js + Tailwind · PP Hatton nos títulos · design system RÉSERVE.

```
/login
/dashboard              → Visão Geral
/trafego                → Tráfego Pago
/leads                  → Leads e Funil
/instagram              → Instagram Orgânico
/atendimento            → Automação WhatsApp (canais, conversas, funil)
/atendimento/bot        → Configuração do bot (dados + propostas de alteração)
/retorno                → Análise de Retorno (ROI)
/calendario             → Calendário de Conteúdo
/plano                  → Plano Semestral
/atividades             → Feed completo
/evolucao               → Linha do Tempo / Antes e Depois
/relatorios             → Resumos quinzenais
/relatorios/[id]        → Leitura do resumo
```

**Princípios de UI:**
1. **Mobile-first real:** desenhado para 375px primeiro. Máximo 1 gráfico por viewport no mobile. Nada de scroll horizontal — tabelas viram cards empilhados.
2. **Gráficos simples:** linha e barra. Sem pizza, radar ou duplo eixo no mobile. Recharts ou Chart.js.
3. **Variação sempre visível:** todo número com "vs. período anterior", seta e cor (atenção à inversão em métricas de custo).
4. **Glossário:** componente `<MetricLabel>` com "?" → tooltip (mobile: bottom sheet). Definições centralizadas em `glossary.ts`.
5. **Skeleton loading + estados vazios desenhados:** bloco sem dado explica o motivo, nunca tela em branco.
6. **Sem jargão em nada visível ao cliente.**

### 4.4 Onboarding de novo cliente (fluxo interno Reserve)

1. Admin cria o tenant + usuários
2. Reserve executa as conexões OAuth (Meta Ads, Instagram, Google Ads, GA4) — **cliente não configura nada**
3. Job de baseline: histórico retroativo + snapshot inicial de seguidores + marco zero
4. Se houver bot: gerar chave de tenant, configurar o nó de eventos no N8N, validar o primeiro evento chegando
5. Definir metas e primeiros itens do plano semestral
6. Registrar atividades iniciais no feed
7. Entregar login pronto + mini-tour (vídeo curto de 2 min ou walkthrough no primeiro acesso)

---

## 5. MÓDULO DE AUTOMAÇÃO DE ATENDIMENTO WHATSAPP

### 5.1 O que o bot já entrega (estudo dos arquivos atuais)

O bot da Pousada Dona Tereza (N8N + Meta Cloud API + PostgreSQL + GPT-4o mini + Whisper + Chatwoot) **já produz quase tudo que o painel precisa**. Não é preciso inventar um funil — é preciso ler o que existe.

| Tabela do bot | O que já entrega ao painel |
|---|---|
| `config` | Estado do kill switch (`bot_global`) → indicador de bot ligado/desligado |
| `contatos` | `status_bot` (ATIVO/PAUSADO), `motivo_pausa`, `origem` (anuncio/organico), `janela_expira`, `consentimento_lgpd` |
| `conversas` | Histórico completo: `role` (user/assistant/human), `mensagem`, `tipo` (texto/audio/imagem), timestamp |
| `leads` | **Funil pronto:** `status` ∈ (NOVO, QUALIFICADO, PAGAMENTO, FECHADO, FRIO) + `perfil`, `datas_interesse`, `acomodacao_interesse` |
| `fila_followup` | `tentativas` (0-4), `proximo_followup`, `status` (AGUARDANDO/FRIO/RESPONDEU) |
| `heartbeat` | Saúde do webhook → indicador de sistema no ar |

**Eventos de conversão já existentes:**
- Tag `[TRANSFERIR]` na resposta da IA → lead pronto para fechar + pausa do bot + alerta ao responsável
- Tag `[PAGAMENTO]` → chave Pix enviada + pausa
- Label `pagamento_confirmado` no Chatwoot ao resolver → lead vira `FECHADO` automaticamente
- Follow-up escalonado (4h/24h texto livre; 72h/7d template) com 4 toques e depois `FRIO`

### 5.2 Bloco "Canais"

Visão única do que está conectado e saudável.

- **WhatsApp:** número, status do bot (ligado/desligado via `bot_global`), saúde do webhook (heartbeat), conversas ativas agora, contatos pausados aguardando humano
- **Instagram:** conta conectada, status do token
- **Meta Ads:** conta conectada, status do token
- **Alerta de saúde:** se um token expirou ou o heartbeat está velho, aparece aviso no painel **e** alerta interno para a Reserve (ver riscos)

### 5.3 Bloco "Conversas" (modo leitura)

**Decisão 11 aplicada:** o painel mostra, o Chatwoot responde.

- Lista de conversas com: número, nome (quando informado), origem (anúncio/orgânico + campanha quando atribuída), estágio no funil, último contato, status do bot (ativo/pausado)
- Abertura da conversa: histórico completo com distinção visual entre mensagem do lead, resposta do bot e resposta humana (o campo `role` já suporta os três)
- Busca por número, por período e por estágio
- Botão **"Responder no Chatwoot"** — deep link direto para a conversa
- Indicador claro quando o bot está pausado, com o motivo e há quanto tempo

**Por que não construir inbox aqui:** dois lugares para responder criam estado dessincronizado. Pior cenário real: o cliente responde pelo painel, não resolve no Chatwoot, e o contato fica pausado para sempre. Fonte única da verdade é regra, não preferência.

### 5.4 Bloco "Funil" (visual e editável com segurança)

**Visualização:** colunas por estágio (NOVO · QUALIFICADO · PAGAMENTO · FECHADO · FRIO) com contagem e valor potencial quando houver acomodação/datas informadas. No mobile, lista agrupada por estágio.

**Edição manual:** o cliente pode mover um lead de estágio. A gravação **nunca sobrescreve** o campo do bot diretamente — grava um evento:

```
funil_eventos
  id · tenant_id · numero_contato · de_estagio · para_estagio
  autor_tipo (bot|humano) · autor_id · motivo · ocorrido_em
```

O estado atual do lead é sempre o **último evento**. Benefícios diretos:

- Bot e humano escrevem sem conflito nem race condition
- Auditoria completa: quem mudou o quê e quando
- **Tempo médio em cada estágio** vira métrica automática — excelente indicador de gargalo de atendimento
- Reversão trivial (basta um novo evento)

**Sincronização de volta:** quando o humano move um lead no painel, o painel emite um evento para o bot (webhook reverso) para manter `leads.status` coerente do lado do N8N. Se a chamada falhar, o log de eventos permanece como verdade e um job reconcilia.

### 5.5 Bloco "Configuração do bot" (dados sim, comportamento não)

**Decisão 13 aplicada.** Casa com a arquitetura modular de prompt já escopada para a v4 do bot: acomodações, políticas, pacotes e encantamento como blocos de dados separados do prompt de comportamento.

**O cliente pode propor alteração em:**
- Preços e acomodações
- Políticas (check-in/out, cancelamento, pets, pagamento)
- Pacotes e opções de encantamento
- Horários de funcionamento e informações operacionais

**O cliente nunca edita:**
- System prompt e regras de comportamento
- A regra de nunca afirmar disponibilidade
- Fluxo de pagamento e tags de transferência
- Configuração técnica (webhooks, tokens, kill switch)

**Fluxo de aprovação:**

```
Cliente propõe alteração
  → status: PENDENTE (painel mostra "aguardando validação da Reserve")
  → Reserve revisa no admin
  → APROVADA: publica no bot + registra no feed de atividades
  → REJEITADA: volta com justificativa
```

Tabela `bot_config_propostas` (tenant, campo, valor_atual, valor_proposto, status, autor, revisor, justificativa, timestamps).

**Argumento comercial:** "toda alteração passa por validação da Reserve antes de ir ao ar" é valor percebido, não burocracia.

### 5.6 Integração bot ↔ painel: API de eventos

**Problema:** cada cliente tem um banco Postgres próprio (`pousada`, `barbearia`). O painel é multi-tenant. Ler o banco do bot direto do painel acopla os dois sistemas e cria complexidade de rede e segurança.

**Solução (Decisão 14):** o N8N empurra eventos para o painel.

```
POST https://portal.reservemkt.com.br/api/ingest/bot-events
Headers:
  X-Tenant-Key: <chave secreta por cliente>
  Content-Type: application/json
Body:
  {
    "event_id": "uuid-v4",
    "event_type": "lead.estagio_alterado",
    "occurred_at": "2026-07-25T14:32:10-03:00",
    "payload": { ... }
  }
Resposta: 202 Accepted
```

**Regras:**
- **Idempotência por `event_id`** — reenvio não duplica
- **Fila de retry no N8N** — falha de rede não perde evento; o painel fora do ar nunca derruba o atendimento
- **O painel nunca alcança o banco do bot** — direção única
- Cada novo cliente com bot precisa apenas da chave de tenant no nó de eventos

**Catálogo de eventos:**

| Evento | Quando dispara | Payload principal |
|---|---|---|
| `conversa.iniciada` | Primeira mensagem de um contato | contato, origem, `ctwa_clid`, `source_id`, `link_code` |
| `mensagem.recebida` | Toda mensagem do lead | contato, tipo (texto/audio/imagem) |
| `mensagem.enviada` | Toda resposta do bot | contato, tipo |
| `lead.estagio_alterado` | Mudança em `leads.status` | contato, de, para, autor |
| `lead.pronto_para_fechar` | Tag `[TRANSFERIR]` | contato, acomodação, datas |
| `pagamento.solicitado` | Tag `[PAGAMENTO]` | contato, valor quando disponível |
| `lead.fechado` | Label `pagamento_confirmado` no Chatwoot | contato |
| `followup.enviado` | Rotina de follow-up | contato, tentativa, tipo de janela |
| `bot.pausado` / `bot.reativado` | Mudança em `status_bot` | contato, motivo |
| `sistema.heartbeat` | A cada hora | timestamp da última mensagem recebida |

**Implementação no N8N:** um nó HTTP Request adicional após cada ponto relevante dos três workflows existentes, com `continueOnFail` ativo para nunca travar o atendimento por causa do painel.

### 5.7 Métricas do módulo

- Conversas iniciadas (dia/quinzena/mês) com variação %
- Taxa de resposta do bot e tempo médio de primeira resposta
- Distribuição por estágio do funil
- **Tempo médio em cada estágio** (derivado de `funil_eventos`)
- Taxa de qualificação (qualificados ÷ conversas)
- Leads prontos para fechar
- Taxa de conversão por etapa, com a fronteira marcada
- Efetividade do follow-up: quantos responderam em cada toque (4h / 24h / 72h / 7d)
- Volume por origem: anúncio vs. orgânico vs. link rastreável
- Contatos pausados aguardando humano — **indicador operacional de gargalo**
- Áudios transcritos (uso do Whisper)

### 5.8 LGPD e privacidade

- Número e conteúdo de conversa são dados do hotel; a Reserve atua como operadora
- Acesso restrito por RBAC ao próprio tenant — nenhum dado cruza entre clientes
- Campo `consentimento_lgpd` já existe em `contatos` e deve ser refletido no painel
- **Política de retenção definida por tenant**, com expurgo automático
- Exportação e exclusão de dados de um contato disponíveis ao `admin`
- O benchmark agregado (seção 7) usa apenas números agregados e anonimizados — nunca conteúdo de conversa

---

## 6. CADEIA DE RASTREAMENTO PONTA A PONTA

**Objetivo:** responder com precisão "este anúncio gerou quantas reservas?".

```
Anúncio Meta / link rastreável
        │  ad_id · código do link
        ▼
      Clique
        │  geo · dispositivo · timestamp
        ▼
Conversa iniciada no WhatsApp
        │  referral: ctwa_clid + source_id
        ▼
    Funil do bot
        │  novo → qualificado → pagamento
        ▼
Lead pronto para fechar          ◄── fronteira da Reserve
        │  tag [TRANSFERIR]
        ▼
  Reserva confirmada             ◄── responsabilidade do hotel
```

### 6.1 O elo que hoje está sendo descartado

Quando alguém clica num anúncio de clique-para-WhatsApp, o webhook da Meta traz um objeto `referral` contendo, entre outros campos, `source_id` (o anúncio) e `ctwa_clid` (o identificador do clique).

**Hoje o bot lê `referral` apenas para decidir se a janela é de 72h ou 24h — e descarta o resto.**

**Mudança necessária no workflow 1:** persistir `ctwa_clid`, `source_id`, `source_type` e `source_url` na tabela `contatos` (ou numa tabela `atribuicao` dedicada) e enviá-los no evento `conversa.iniciada`. Alteração pequena, impacto grande: passa a ser possível dizer "a campanha de inverno gerou 47 conversas, 12 chegaram em pagamento, custo de R$ 31 por lead qualificado".

### 6.2 Fechando o ciclo dos links rastreáveis

O sistema de links (`/wa/:code`) já registra o clique com geo e dispositivo, mas hoje o clique e a conversa são dois eventos soltos.

**Solução:** o redirect embute um código curto na mensagem pré-preenchida do `wa.me?text=`. O bot lê esse código na primeira mensagem, amarra a conversa ao link de origem e o remove do texto antes de processar.

```
/wa/AbCd3xYz
   → registra clique (IP, geo, dispositivo, referrer)
   → redireciona para wa.me/55XXXXXXXXXXX?text=Olá! Vim pelo site [AbCd3xYz]
   → bot extrai [AbCd3xYz] da primeira mensagem
   → evento conversa.iniciada com link_code=AbCd3xYz
```

**Métrica desbloqueada:** taxa de conversão clique → conversa por link. Hoje sabemos quantos clicaram; passamos a saber quantos realmente falaram.

### 6.3 Do site até o bot

- UTM capturada na landing e persistida na sessão
- O botão de WhatsApp do site usa link rastreável com a UTM embutida no código
- GA4 já dá sessões e comportamento; o link fecha a ponte entre visita e conversa

### 6.4 Tabela de atribuição

```
atribuicao_conversa
  id · tenant_id · numero_contato · ocorrido_em
  fonte (anuncio|link|organico|site)
  ad_id · adset_id · campaign_id · ctwa_clid
  link_code · utm_source · utm_medium · utm_campaign
  primeiro_toque (bool) · ultimo_toque (bool)
```

**Modelo de atribuição:** último toque como padrão (simples de explicar ao cliente), com primeiro toque registrado para análise interna. A janela é a definida em `attribution_settings` e **sempre visível no painel**.

---

## 7. BENCHMARK INTERNO DA AGÊNCIA

**Objetivo:** acumular base própria para afirmar, com dado, o impacto médio do serviço da Reserve.

**Métricas agregadas por cliente e por tempo de contrato:**
- Variação de conversas iniciadas nos primeiros 30/60/90/180 dias
- Evolução do custo por conversa ao longo do contrato
- Taxa média de qualificação dos bots
- Crescimento de seguidores e engajamento no Instagram
- Tempo médio até o primeiro resultado relevante

**Regra de uso (Decisão 16 — inegociável):**

| Situação | Uso permitido |
|---|---|
| < 5 clientes ou < 6 meses de base | **Nenhum uso público.** Apenas caso a caso, nominal, com autorização do cliente ("na Pousada Dona Tereza, em 4 meses, X virou Y") |
| ≥ 5 clientes e ≥ 6 meses | Média agregada e anonimizada em proposta comercial, com n e período sempre declarados |

**Por que a regra existe:** com dois clientes, qualquer "média de crescimento" é estatisticamente vazia. Usar isso em proposta é risco direto à credibilidade — que é exatamente o que o painel inteiro existe para construir.

**Backend:** job de agregação anonimizada em tabela `benchmark_agregado`, sem qualquer dado identificável nem conteúdo de conversa.

---

## 8. FASES DE IMPLEMENTAÇÃO

### Fase 1 — Fundação do valor
- [ ] Service de comparativo período vs. período
- [ ] Home / Visão Geral com 4 cards + gráfico + variações
- [ ] Bloco Tráfego Pago completo
- [ ] Bloco Leads camada 1 (links rastreáveis)
- [ ] Glossário (componente + definições)
- [ ] Responsividade mobile de tudo acima
- [ ] Deploy em `portal.reservemkt.com.br`

**Critério de pronto:** Pousada Dona Tereza loga e vê investimento, conversas e variação quinzenal no celular.

### Fase 2 — Rastreamento ponta a ponta
- [ ] Persistir `ctwa_clid` / `source_id` no workflow 1 do bot
- [ ] Código curto no link rastreável + extração na primeira mensagem
- [ ] Tabela `atribuicao_conversa` + `attribution_settings`
- [ ] Desempenho por campanha no bloco de tráfego (conversas e qualificados por anúncio)
- [ ] Taxa clique → conversa por link

### Fase 3 — Módulo de automação WhatsApp
- [ ] API de ingestão `POST /api/ingest/bot-events` com idempotência
- [ ] Nós de evento nos 3 workflows do N8N (com `continueOnFail`)
- [ ] Tabela `funil_eventos` + reconciliação com o bot
- [ ] Bloco Canais (status, saúde, heartbeat)
- [ ] Bloco Conversas em modo leitura + deep link para o Chatwoot
- [ ] Bloco Funil visual com edição por evento
- [ ] Métricas do módulo (5.7)
- [ ] Política de retenção e controles de LGPD

### Fase 4 — Instagram + Conteúdo
- [ ] OAuth Instagram Graph API + sync diário
- [ ] Snapshot diário de seguidores (cron)
- [ ] Bloco Instagram Orgânico
- [ ] `content_posts` + tela de calendário
- [ ] **Spike técnico:** validar exposição de scheduled posts via API na conta real; decidir API vs. sistema próprio
- [ ] Feed de atividades (`activity_log`)

### Fase 5 — Narrativa, direção e retenção
- [ ] Bloco Análise de Retorno — Níveis 1 e 2
- [ ] Resumo quinzenal + digest automático por email
- [ ] Linha do tempo / marcos / marco zero
- [ ] Job de baseline retroativa
- [ ] Plano semestral (`plano_semestral` + `plano_entregas`)
- [ ] Metas configuráveis
- [ ] Configuração do bot com fluxo de aprovação (`bot_config_propostas`)

### Fase 6 — Acabamento e escala
- [ ] Exportação PDF
- [ ] Análise de Retorno Nível 3 (ROAS, quando houver motor)
- [ ] Digest e notificações via WhatsApp (template aprovado)
- [ ] Google Ads no bloco de tráfego
- [ ] Benchmark agregado da agência
- [ ] Monitoramento de saúde de conexões e alertas internos
- [ ] Mini-tour de primeiro acesso

---

## 9. RISCOS E PONTOS DE ATENÇÃO

| Risco | Mitigação |
|---|---|
| Dois lugares para responder (painel + Chatwoot) dessincronizam o estado | Painel é leitura + deep link. Chatwoot é fonte única da verdade. |
| Bot fica preso em PAUSADO porque ninguém resolveu no Chatwoot | Vigia de 12h (re-alerta) e 48h (reativa) já existe no workflow 3 · indicador de pausados no painel |
| Bot e humano escrevendo no mesmo campo de status | `funil_eventos` append-only com autor · estado = último evento |
| Cliente edita o prompt e quebra o bot | Cliente edita dados, nunca comportamento · fluxo de aprovação obrigatório |
| Queda do painel derrubar o atendimento | Direção única (bot → painel) · `continueOnFail` nos nós de evento · fila de retry |
| Evento duplicado inflar métrica | Idempotência por `event_id` na API de ingestão |
| Meta API não expor posts agendados do Business Suite | Fallback: agendamento no nosso sistema (pode virar o padrão) |
| Instagram não dar histórico de seguidores | Snapshot diário desde o dia 1 + baseline manual no onboarding |
| Cliente sem motor cobrar "cadê as reservas?" | Camadas do funil + fronteira explícita no gráfico |
| Dado em tempo real gerar pergunta ansiosa | Resumo quinzenal narrado é obrigatório, não opcional |
| Painel bonito que ninguém loga | Digest com números no corpo do email + feed de atividades |
| Número de ROI virar discussão | Janela de atribuição declarada e visível · nunca estimar receita |
| Digest automático enviar número fora de contexto | Job gera rascunho, humano revisa e publica |
| Estatística de agência sem base virar risco de credibilidade | Piso de 5 clientes e 6 meses antes de qualquer uso público |
| Token OAuth expirar e sync parar em silêncio | Monitoramento de saúde das conexões + alerta interno |
| Custo de mensagem da Meta (mudança de out/2026) | Monitorar margem no preço de R$ 500/mês · métricas de volume por cliente no painel |
| Escopo crescer para virar CRM | Fronteira da seção 1.4 + filtro do Anexo A |

---

## 10. ARGUMENTO COMERCIAL (resumo para proposta)

> "Você não vai receber um PDF por mês. Você vai ter um portal, no seu celular, onde vê em tempo real quanto está investindo, quantas pessoas estão chamando no seu WhatsApp por causa disso, em que estágio cada conversa está, o que nossa equipe fez essa semana pelo seu negócio, o plano dos próximos seis meses, e a evolução completa desde antes de a Reserve chegar. A cada quinze dias, um resumo em português claro explica o que os números significam e o que vem a seguir."

**Diferenciais verificados contra o mercado (pesquisa jul/2026):**
- Links rastreáveis de WhatsApp com analytics: nenhuma agência identificada oferece
- Atribuição de campanha até o funil de atendimento automatizado: nenhuma agência identificada oferece
- Integração nativa com motores de reserva brasileiros: nenhuma agência identificada oferece
- Booking window + paridade no mesmo painel: só existe em ferramentas pagas separadas
- Feed de atividades + calendário de conteúdo + plano semestral visíveis ao cliente: raro mesmo internacionalmente

---

## ANEXO A — FILTRO DE DECISÃO PARA FEATURES DE CRM

Benchmark realizado: **Kommo** (CRM de vendas multicanal). Outros CRMs de hotelaria serão avaliados com o mesmo filtro.

### A pergunta única

> **Isso ajuda o cliente a VER o resultado da Reserve, ou ajuda o hotel a OPERAR a venda dele?**

- **Ver resultado da Reserve** → entra no painel
- **Operar a venda do hotel** → ou é produto separado (bot, Chatwoot, mailer), ou não é nosso

### Classificação do benchmark Kommo

| Feature Kommo | Destino | Observação |
|---|---|---|
| Centralização de canais (inbox unificado) | **Parcial — v2.0** | Painel mostra canais e conversas em leitura; responder segue no Chatwoot |
| Templates de mensagem | Já temos | Templates de WhatsApp aprovados pela Meta no backend |
| Agendamento de reuniões | Já temos | Módulo `reserve-leads` com slots dinâmicos |
| Bots e automações | Já temos | É o produto principal da Reserve |
| Registro de atividades | Já no plano | `activity_log`, Fase 4 |
| Envio em massa e segmentação | Já temos | `reserve-mailer` com BullMQ e tracking |
| **Análise de ROI** | **ENTRA** | Bloco 3.9, em camadas |
| **Envio automático de resultados** | **ENTRA** | Digest quinzenal 3.7.1 |
| **Funil visual editável** | **ENTRA — v2.0** | Bloco 5.4, via log de eventos (nunca escrita direta) |
| Distribuição automática de leads | Produto separado | Operação de atendimento → ecossistema bot/Chatwoot |
| Envio em massa para base de hóspedes | Serviço adicional vendável | Dados de hóspedes são do hotel |
| Funis kanban arrastáveis genéricos | Ignorar | Nosso funil é específico do atendimento, não genérico de vendas |
| Campos com fórmulas, catálogos, permissões por campo | Ignorar | Complexidade enterprise sem uso no nosso contexto |
| SSO corporativo | Ignorar | Fora da escala dos nossos clientes |
| Dashboard personalizável | **Ignorar deliberadamente** | Nosso diferencial é a visão opinada |

### Regra de aplicação

Toda feature avaliada em benchmarks futuros deve ser classificada em uma destas cinco categorias antes de entrar em qualquer backlog: **já temos · já no plano · entra no painel · produto separado · ignorar**.

---

*RÉSERVE — Ecossistema de Aquisição de Hóspedes · Documento interno de produto · v2.0 · Julho 2026*
