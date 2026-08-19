# Motor de Reservas v2 — Design Macro (Upgrade inspirado no HBook/HSystem)

Data: 2026-08-19 · Status: aprovado pelo Gabriel · Spec base: `docs/MOTOR_RESERVAS_RESERVE_MASTER.md`

## Contexto

A Fase 1 do motor está entregue (telas `/dashboard/motor/*`, backend com holds/constraints/RBAC). O backend é sólido; o problema é **superfície**: poucas telas, densidade baixa, visual com "cara de IA". O HBook (motor da HSystem, validado em produção na Pousada Dona Tereza) serve de referência funcional — não visual (o design dele é datado; queremos a densidade dele com a nossa identidade).

Auditoria de dashboards existentes encontrou redundância grave:

- `/dashboard/stats` é clone literal (re-export) de `/dashboard`, órfão de navegação.
- `/dashboard` (branch manager), `/dashboard/hotel/overview` e `/dashboard/hotel/ota` repetem os mesmos KPIs (comissão recuperada, direto vs OTA, ocupação), duas consumindo o mesmo endpoint.
- "Retorno (ROI)" duplica ROAS/receita atribuída/investimento do overview.
- Dois "Relatórios" sem relação: CRUD de links (superadmin) vs Relatório Mensal editorial.
- Funil do Bot, Evolução, Tráfego, Site: detalhamentos legítimos, sobreposição baixa.

## Escopo

**Ativo (este ciclo):** Frente 1 (Calendário completo) · Frente 2 (Home unificada + consolidação) · Frente 3 (Navegação + passe de design).

**Adiado (documentado em `docs/MOTOR_V2_FUTURO_PROMOCOES_MARKETING.md`):** Frente 4 (Promoções: ofertas/códigos/pacotes) · Frente 5 (Marketing/recuperação).

## 1. Navegação

- Grupo da sidebar renomeado de "Calendário" para **"Motor de Reservas"**: Calendário (abas internas: Ocupação · Grade de tarifas · Atualização em massa) · Reservas · Tarifas · Acomodações · Canais (OTAs). Sem item "Visão geral" — a visão de desempenho vive na home.
- Item solto "Visão Geral" (`/hotel/overview`) sai da sidebar; manager cai direto na home unificada.
- "OTA vs Direto" (`/hotel/ota`) sai como tela própria (vira seção da home).
- "Relatórios" do superadmin renomeado (ex.: "Links de relatórios") para eliminar a colisão de nome com "Relatório Mensal".
- Resto da sidebar intocado.

## 2. Frente 1 — Calendário completo

### 2.1 Grade de tarifas (nova aba, referência: grade do HBook)

- Linhas por tipo de acomodação (`room_type`); colunas = dias da janela escolhida.
- Por célula/dia: **unidades livres** (número; destaque vermelho quando 0 ou stop de vendas), **preço por ocupação** (derivado do modelo existente: linha "capacidade base" = preço base; linha "base+1" = preço base + valor pessoa adicional), **mín. noites**, riscado quando stop.
- Clique na célula abre popover de edição pontual (preço, mín. noites, fechar venda) — reusa o endpoint de edição pontual do `daily_inventory` já existente.

### 2.2 Atualização em massa (nova aba, referência: "Atualizar preços/restrições" do HBook)

- Formulário: período (início/fim) + dias da semana (checkboxes) + tipos de acomodação selecionados + campos a aplicar (preço e/ou mín. noites e/ou stop de vendas/chegada fechada/saída fechada). Campos não preenchidos não são alterados.
- **Preview antes de aplicar**: quantas datas × tipos serão afetados.
- Backend: endpoint bulk novo que grava overrides no `motor_daily_inventory` em lote (uma transação, respeitando o padrão de override que o job de materialização não sobrescreve).

### 2.3 Barra de período unificada (Ocupação + Grade)

- Setas ‹ ›, título clicável com seletor próprio de mês/ano (substitui o input nativo do navegador), botão "Hoje", alternador de janela: **Mês | 14 dias | 7 dias | Personalizado** (range de dias livre).
- Componente único compartilhado pelas duas visões.

### 2.4 Ocupação (existente)

- Mantém a visão unidade × dia (diferencial nosso — o HBook não tem equivalente à altura). Ganha a barra de período nova e o passe visual da Frente 3. Comportamento de clique na célula (bloquear/reservar) permanece.

## 3. Frente 2 — Home unificada + consolidação

`/dashboard` (branch manager) vira **a única visão de desempenho**, em faixas:

1. **Funil do bot**: conversas iniciadas → fases do funil → fechamentos; taxa de conversão ponta a ponta; R$ gerado pelo bot (reservas do motor com `origem=BOT_WHATSAPP`). Topo do funil = **conversas iniciadas** (não há "acessos" — não temos site; decisão do Gabriel).
2. **Receita do motor**: receita, ticket médio, room nights, canceladas (valor e quantidade), **a recuperar** (holds expirados — gancho de recuperação via bot, análogo às "reservas a recuperar" do HBook).
3. **Canais**: direto vs OTA (absorve a tela OTA vs Direto), comissão recuperada.
4. **Ocupação e ritmo**: taxa de ocupação vs meta, gráfico temporal.

**Consolidação:**

- Deletar `/dashboard/stats` (clone órfão). Manter `/dashboard/stats/integrations` acessível (é linkada de dentro da home).
- Aposentar `/hotel/overview` → redirect para a home.
- Aposentar `/hotel/ota` → redirect para a home (seção Canais).
- Ficam como telas de detalhe: Funil do Bot (kanban operacional), Retorno/ROI (mergulho por campanha; a home mostra resumo e linka), Tráfego, Site, Evolução, Relatório Mensal.
- Backend: endpoint agregador da home (funil + motor + canais em uma chamada) para evitar N requests.

## 4. Frente 3 — Passe de design ("tirar a cara de IA")

Abrangência: telas do motor + home unificada + sidebar. O restante do painel herda a linguagem depois, fora deste escopo.

- Densidade maior: tabelas de verdade no lugar de cards soltos e espaçados.
- Hierarquia tipográfica clara (título/descrição/dado com pesos distintos).
- Estados vazios com ação (não só texto).
- Confirmações destrutivas padronizadas.
- Componente de período novo (2.3) como peça central da linguagem.
- Referência de densidade: HBook. Referência visual: identidade Réserve existente — não copiar o roxo/tabelas engessadas do HBook.

## 5. Backend — resumo do que nasce

- Endpoint da grade: calendário por `room_type` com preço/ocupação derivada/unidades livres/min_stay/stop por dia.
- Endpoint bulk de preços/restrições (2.2).
- Endpoint agregador da home (3).
- Redirects das telas aposentadas.
- **Nenhuma mudança de modelo de dados** — tudo deriva do que a Fase 1 criou.

## 6. Ordem de entrega

1. Navegação + barra de período + passe de design nas telas existentes (base visual).
2. Grade de tarifas + atualização em massa.
3. Home unificada + aposentadorias.

## 7. Fora de escopo (registrado)

- Promoções e Marketing (frentes 4–5): ver `docs/MOTOR_V2_FUTURO_PROMOCOES_MARKETING.md`.
- Integrações GA4/Pixel/scripts do HBook: só fazem sentido com widget/site próprio (Fase 4 da spec master).
- Passe de design no painel inteiro.
