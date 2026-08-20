# Motor de Reservas Réserve — Fase 3 (Cutover Dona Tereza) — Runbook + Tasks de apoio

> Documento operacional derivado da spec (`docs/MOTOR_RESERVAS_RESERVE_MASTER.md` §9, §7, §12).
> A maior parte desta fase é **operação humana com checklist**, não código. As 3 tasks de
> desenvolvimento de apoio estão no final e podem ser executadas com o padrão da Fase 1.
>
> **PRÉ-REQUISITOS DUROS (nenhum passo do cutover começa sem todos):**
> - [ ] Fase 1 em produção, testada (motor + admin no painel)
> - [ ] Fase 2 validada na conta demo (plano `2026-08-18-motor-reservas-fase2-beds24.md`, Task 7)
> - [ ] Conta Beds24 REAL criada, propriedade Dona Tereza configurada
> - [ ] Mapeamento manual Booking feito no painel Beds24 (~uma tarde)
> - [ ] Airbnb conectado via API
> - [ ] Bot integrado ao motor em ambiente de teste (`motor_mode: on` testado)
> - [ ] Export das reservas futuras do HBOOK em mãos (pedir à HSystem/Débora — spec §12)
> - [ ] Aceite POR ESCRITO da Débora da regra de coexistência do site (spec §9.7 e §12)
> - [ ] Seed das permissões `motor.*` rodado no banco de produção (`npx prisma db seed`) e migrations aplicadas (`prisma migrate deploy`) — pendência registrada na execução da Fase 1 (banco Neon remoto não foi tocado)

## A ordem exata da virada (spec §9 — não reordenar)

**Rollback:** enquanto o passo 5 não acontece, tudo é reversível — bot volta a `motor_mode: off` (handoff) e o HUNIT segue nas OTAs. Depois do passo 5, o caminho é só para frente.

- [ ] **1. Congelar referência** — exportar do HBOOK todas as reservas futuras (diretas + OTA), planilha ou tela, o que a HSystem der. Guardar o arquivo (é a referência da conferência tripla).
- [ ] **2. Importar no motor** — todas as reservas futuras com origem `SITE_HSYSTEM`/`MANUAL` e **unidade alocada** (Task DEV-1 abaixo). Conferir contagem: nº de linhas do export = nº de reservas importadas.
- [ ] **3. Conectar canais ao Beds24** — Airbnb envia as futuras automaticamente na conexão; Booking: importar/conferir contra o export do passo 1. ⚠️ As reservas DIRETAS do HBOOK não vêm por canal nenhum — só pelo passo 2.
- [ ] **4. Conferência tripla** — motor × export HBOOK × extranets (Booking/Airbnb). **Zero divergência antes de prosseguir.** Usar o mapa `/dashboard/motor/calendario` lado a lado com as extranets, mês a mês até o horizonte de reservas.
- [ ] **5. Desconectar as OTAs do HUNIT** — a pousada solicita à HSystem, **no mesmo momento** em que o Beds24 assume. NUNCA os dois channel managers ativos nas mesmas OTAs (risco §11: overbooking com responsabilidade objetiva do CDC).
- [ ] **6. Virar o bot** — `motor_mode: on` (flag por tenant; a virada é trocar a flag, não reescrever prompt/workflow — spec §6).
- [ ] **7. Regra de coexistência do site** (enquanto o site HSystem existir): o site vende pelo HBOOK com calendário próprio → TODA reserva do site é cadastrada no motor NO MESMO DIA pela gerente (alerta/rotina — Task DEV-3) e, em ocupação alta, fechar datas manualmente no HBOOK. Janela de risco documentada e aceita por escrito. Encerramento definitivo na entrega do site novo (próximo contrato).
- [ ] **8. Monitoramento reforçado 14 dias** — reconciliação 2×/dia (flag `reconcile_2x` da Fase 2), alerta de divergência imediato, revisão diária do mapa pela equipe Réserve.

## Integração Hotel Flow (spec §7 — [A CONFIRMAR])

Aguardando resposta do hotelflow sobre API de origem adicional:
- **Com API**: toda reserva CONFIRMADA/alterada/cancelada no motor vai ao hotelflow (fila + retry, mesmo padrão da fila de push da Fase 2). Vira uma task de desenvolvimento quando a resposta chegar.
- **Sem API**: notificação automática no WhatsApp da equipe (fluxo de equipe do bot v5): "Nova reserva: [tipo], [datas], [hóspede], saldo no check-in R$X — lançar no hotelflow". Já coberto: o `MotorBotEventsProvider` despacha os eventos; falta só o workflow N8N do lado do bot.
- O hotelflow segue integrado à HSystem para o que já faz; o motor é origem ADICIONAL.

## Onboarding operacional Dona Tereza (seed de dados no motor, antes do passo 1)

- [ ] Cadastrar os 5 room_types e ~8 units em `/dashboard/motor/acomodacoes`
- [ ] Bloqueio PERMANENTE do chalé do mensalista (motivo MENSALISTA, sem data fim) — regra v5
- [ ] Rate plan "Marina" com o percentual de desconto combinado
- [ ] Política de cancelamento: 7 dias / sem reembolso após prazo / no-show 100%
- [ ] Temporadas + regras de preço (fim de semana diária cheia, meio de semana ~-20%) e conferir o calendário materializado em `/dashboard/motor/tarifas`
- [ ] `minStay` pontuais (ex.: 7 de setembro minStay=2) via edição pontual
- [ ] Gerar a chave do bot (`BotIntegrationConfig`) e configurar `n8n_motor_webhook_url` (WF9)
- [ ] Ligar o módulo `motor` do tenant na aba Módulos

---

## Tasks de desenvolvimento de apoio (padrão da Fase 1: TDD, specs colocados, commits PT)

### Task DEV-1: Importador de reservas do cutover

**Repo:** `BACK` — `POST /api/motor/:tenantId/reservations/import` (permissão `motor.reservations.manage`), body: array de `{ checkin, checkout, hospede_nome, hospede_telefone?, room_type_nome, unit_identificador?, valor_total?, origem: 'SITE_HSYSTEM' | 'MANUAL', external_ref? }`.
- Resolve `room_type` por nome (case-insensitive) e unit por identificador; sem unit informada, aloca com o protocolo de lock da Fase 1.
- **Dry-run por padrão** (`?commit=true` para gravar): resposta lista linha a linha `ok | conflito | room_type_desconhecido`, para conferir ANTES de gravar.
- Idempotente por `external_ref` (reimportar o mesmo export não duplica).
- Evento `CRIADA` com payload `{ import: true }` em cada reserva.

### Task DEV-2: Reconciliação 2×/dia (se ainda não coberto pela Fase 2)

Confirmar que a flag `reconcile_2x` da Fase 2 Task 5 existe e é acionável pela tela de canais; senão, adicionar o toggle na tela + segundo horário no cron.

### Task DEV-3: Rotina da reserva do site (coexistência)

**Repo:** `BACK` — cron diário 18h que envia ao WhatsApp da equipe (via `MotorBotEventsProvider`, evento `rotina.site_hsystem`) o lembrete: "Alguma reserva entrou pelo site hoje? Cadastre no motor antes de fechar o dia." Ativado por flag no tenant (`tenant_settings`), desligado quando o site novo entrar. Simples de propósito — o volume da pousada torna isso operável.

---

## Critérios de saída da Fase 3

- 14 dias de monitoramento reforçado sem divergência não explicada
- Zero overbooking; zero reserva do site perdida na janela de coexistência
- Bot operando `motor_mode: on` com reservas confirmadas de ponta a ponta (availability → hold → Pix/cartão → confirmação → push Beds24 → aviso à equipe)
- Aí sim: Fase 4 (produto — tarifas derivadas, cupons, widget do site novo, white label, ROI por canal no Painel)
