# Módulo de Notificações — Guia de Integração Frontend

## Visão Geral

O módulo `zarp-notifications` é a camada de comunicação entre a plataforma Zarp e os tenants. Ele suporta:

- **Dois perfis de uso**: super_admin (CRUD completo) e tenant admin (inbox de leitura)
- **Duas origens**: manual (criado pelo super_admin) e automática (eventos do sistema + cron jobs)
- **Dois canais de entrega**: in-app e email
- **Segmentação**: broadcast (todos os tenants) ou segmentado (tenants específicos)
- **Rastreamento de leitura**: por admin individual + agregado por tenant

---

## Endpoints da API

Base URL: `https://api.zarpstudio.com/api`

Todos os endpoints autenticados exigem o header `Authorization: Bearer <token>`.  
Endpoints de tenant exigem também `x-tenant-id: <tenantId>`.

---

### Super Admin — CRUD de Notificações

#### Criar rascunho

```
POST /api/notifications
Authorization: Bearer <token>
```

**Body:**
```json
{
  "title": "Atualização importante",
  "body": "Texto completo da notificação...",
  "type": "manual",
  "scope": "broadcast",
  "tenant_ids": [],
  "send_email": false,
  "scheduled_at": "2026-06-01T09:00:00Z"
}
```

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `title` | string | ✅ | Máx. 255 caracteres |
| `body` | string | ✅ | Corpo da notificação |
| `type` | `manual \| event \| scheduled` | ✅ | Tipo da notificação |
| `scope` | `broadcast \| targeted` | ✅ | Segmentação |
| `tenant_ids` | string[] | ❌ | Obrigatório quando `scope = targeted` |
| `send_email` | boolean | ❌ | Default: `false` |
| `scheduled_at` | ISO 8601 | ❌ | Data de agendamento |

**Resposta (201):**
```json
{
  "id": "clxyz123",
  "title": "Atualização importante",
  "body": "Texto completo da notificação...",
  "type": "manual",
  "scope": "broadcast",
  "tenant_ids": [],
  "send_email": false,
  "published_at": null,
  "created_at": "2026-05-26T10:00:00Z"
}
```

---

#### Publicar notificação

```
POST /api/notifications/:id/publish
Authorization: Bearer <token>
```

Ao publicar, a notificação é entregue a todos os tenants alvo. Notificações já publicadas **não podem ser reeditadas nem excluídas**.

**Resposta (200):** objeto `Notification` com `published_at` preenchido.

---

#### Listar notificações

```
GET /api/notifications?type=manual&scope=broadcast&published=true&page=1&limit=20
Authorization: Bearer <token>
```

| Query Param | Tipo | Descrição |
|---|---|---|
| `type` | `manual \| event \| scheduled` | Filtrar por tipo |
| `scope` | `broadcast \| targeted` | Filtrar por escopo |
| `published` | `true \| false` | Filtrar por status de publicação |
| `page` | number | Default: 1 |
| `limit` | number | Default: 20 |

**Resposta (200):**
```json
{
  "data": [/* Notification[] */],
  "total": 42
}
```

---

#### Buscar por ID

```
GET /api/notifications/:id
Authorization: Bearer <token>
```

---

#### Atualizar rascunho

```
PATCH /api/notifications/:id
Authorization: Bearer <token>
```

Apenas notificações não publicadas (`published_at = null`) podem ser editadas.

---

#### Excluir rascunho

```
DELETE /api/notifications/:id
Authorization: Bearer <token>
```

Apenas rascunhos. Retorna `204 No Content`.

---

### Tenant Admin — Inbox

#### Listar notificações do inbox

```
GET /api/notifications/tenant?page=1&limit=20
Authorization: Bearer <token>
x-tenant-id: <tenantId>
```

Retorna receipts do admin autenticado incluindo o objeto `Notification` aninhado.

**Resposta (200):**
```json
{
  "data": [
    {
      "id": "receipt_id",
      "notification_id": "notif_id",
      "tenant_id": "tenant_abc",
      "admin_id": "admin_xyz",
      "viewed": false,
      "first_viewed_at": null,
      "last_viewed_at": null,
      "created_at": "2026-05-26T10:00:00Z",
      "Notification": {
        "id": "notif_id",
        "title": "Novo lead cadastrado",
        "body": "Um novo lead foi registrado em sua conta.",
        "type": "event",
        "scope": "targeted",
        "published_at": "2026-05-26T09:55:00Z"
      }
    }
  ],
  "total": 5
}
```

---

#### Contar não lidas

```
GET /api/notifications/tenant/me/unread-count
Authorization: Bearer <token>
x-tenant-id: <tenantId>
```

**Resposta (200):**
```json
{ "count": 3 }
```

---

#### Marcar como lida

```
POST /api/notifications/tenant/:id/view
Authorization: Bearer <token>
x-tenant-id: <tenantId>
```

Atualiza o receipt do admin **e** o agregado do tenant. Retorna `{ "ok": true }`.

---

### Configurações de Notificação

#### Obter configurações do próprio tenant

```
GET /api/notifications/settings
Authorization: Bearer <token>
x-tenant-id: <tenantId>
```

**Resposta (200):**
```json
{
  "id": "settings_id",
  "tenant_id": "tenant_abc",
  "email_enabled": true,
  "inapp_enabled": true,
  "event_settings": {
    "lead.created": true,
    "subscription.expiring": false
  },
  "cron_settings": {
    "subscription.expiry_check": true
  },
  "timezone": "America/Sao_Paulo",
  "created_at": "2026-05-26T00:00:00Z",
  "updated_at": "2026-05-26T10:00:00Z"
}
```

#### Atualizar configurações do próprio tenant

```
PATCH /api/notifications/settings
Authorization: Bearer <token>
x-tenant-id: <tenantId>
```

**Body (todos os campos opcionais):**
```json
{
  "email_enabled": false,
  "inapp_enabled": true,
  "event_settings": {
    "lead.created": true,
    "subscription.expiring": false,
    "subscription.expired": true
  },
  "cron_settings": {
    "subscription.expiry_check": true,
    "subscription.expired_check": false
  }
}
```

Chaves de eventos válidas: `lead.created`, `subscription.expiring`, `subscription.expired`  
Chaves de cron válidas: `subscription.expiry_check`, `subscription.expired_check`

Enviar uma chave desconhecida retorna `400 Bad Request`.

#### Super admin — Configurações de qualquer tenant

```
GET  /api/notifications/settings/:tenantId
PATCH /api/notifications/settings/:tenantId
Authorization: Bearer <token>
```

Mesma interface, sem o header `x-tenant-id`.

---

## Arquivos Criados

### Hooks (`src/common/hooks/notifications/`)

| Arquivo | Exporta | Uso |
|---|---|---|
| `use-notification-inbox.ts` | `useNotificationInbox(tenantId, page, limit)` | Inbox do tenant admin |
| `use-unread-count.ts` | `useUnreadCount(tenantId)` | Contagem de não lidas (polling 60s) |
| `use-notifications.ts` | `useNotifications(filters)` | Listagem para super_admin |
| `use-notification-settings.ts` | `useNotificationSettings(tenantId, isSuperAdmin)` | Configurações do tenant |
| `index.ts` | re-exports | Import único |

#### Exemplo: useNotificationInbox

```typescript
import { useNotificationInbox } from '@/src/common/hooks/notifications';

function InboxPage() {
  const tenantId = useTenantStore(s => s.selectedTenant?.id ?? null);
  const { data, total, loading, markAsViewed, refetch } = useNotificationInbox(tenantId, 1, 20);

  return (
    <div>
      {data.map(item => (
        <div key={item.id} onClick={() => markAsViewed(item.notification_id)}>
          <strong>{item.Notification?.title}</strong>
          {!item.viewed && <span>● não lida</span>}
        </div>
      ))}
    </div>
  );
}
```

#### Exemplo: useUnreadCount

```typescript
import { useUnreadCount } from '@/src/common/hooks/notifications';

function BadgeExample() {
  const tenantId = useTenantStore(s => s.selectedTenant?.id ?? null);
  const count = useUnreadCount(tenantId); // polling automático a cada 60s
  if (!count) return null;
  return <span>{count > 99 ? '99+' : count}</span>;
}
```

#### Exemplo: useNotifications (super_admin)

```typescript
import { useNotifications } from '@/src/common/hooks/notifications';

function AdminList() {
  const { data, total, loading, refetch } = useNotifications({
    type: 'manual',
    published: false,
    page: 1,
    limit: 20,
  });
  // ...
}
```

#### Exemplo: useNotificationSettings

```typescript
import { useNotificationSettings } from '@/src/common/hooks/notifications';

// Tenant admin — edita as próprias configurações
const { settings, loading, updateSettings } = useNotificationSettings(tenantId);

// Super admin — edita as configurações de um tenant específico
const { settings, loading, updateSettings } = useNotificationSettings(tenantId, true);

// Desabilitar email para o tenant
await updateSettings({ email_enabled: false });

// Desabilitar evento específico
await updateSettings({ event_settings: { 'lead.created': false } });
```

---

### Componentes (`src/components/notifications/`)

| Componente | Props | Descrição |
|---|---|---|
| `NotificationBadge` | — | Contador vermelho de não lidas; `null` quando zero |
| `NotificationInbox` | — | Lista de receipts do tenant logado |
| `NotificationList` | — | Tabela de todas as notificações (super_admin) |
| `NotificationForm` | `initial?`, `id?` | Formulário de criação/edição de rascunho |
| `TenantNotificationSettingsForm` | `tenantId`, `isSuperAdmin?` | Formulário de configurações do tenant |

#### NotificationBadge

Lê o tenant do `useTenantStore` automaticamente. Use no sidebar ou em qualquer ícone de sino.

```tsx
import { NotificationBadge } from '@/src/components/notifications/notification-badge';

<BellIcon />
<NotificationBadge />
```

#### NotificationForm — criar notificação

```tsx
import { NotificationForm } from '@/src/components/notifications/notification-form';

// Criação
<NotificationForm />

// Edição (carregar dados do rascunho primeiro)
<NotificationForm initial={notification} id={notification.id} />
```

Ao salvar, redireciona para `/dashboard/global/notifications`.

#### TenantNotificationSettingsForm

```tsx
import { TenantNotificationSettingsForm } from '@/src/components/notifications/tenant-notification-settings-form';

// Tenant admin editando as próprias configurações
<TenantNotificationSettingsForm tenantId={tenantId} />

// Super admin editando configurações de outro tenant
<TenantNotificationSettingsForm tenantId={tenantId} isSuperAdmin />
```

---

### Páginas (`src/app/dashboard/`)

| Rota | Arquivo | Papel |
|---|---|---|
| `/dashboard/notifications` | `notifications/page.tsx` | Inbox do tenant admin |
| `/dashboard/global/notifications` | `global/notifications/page.tsx` | Listagem super_admin |
| `/dashboard/global/notifications/new` | `global/notifications/new/page.tsx` | Criar rascunho |
| `/dashboard/global/notifications/:id` | `global/notifications/[id]/page.tsx` | Editar rascunho |
| `/dashboard/global/notifications/settings/:tenantId` | `global/notifications/settings/[tenantId]/page.tsx` | Configurações de tenant |

---

### Sidebar (`src/components/ui/aside.tsx`)

O item de navegação `notifications` foi adicionado nos três escopos:

| Escopo | Rota | Badge |
|---|---|---|
| global (super_admin) | `/dashboard/global/notifications` | Não |
| super_admin c/ tenant | `/dashboard/notifications` | `<NotificationBadge />` |
| roles normais | `/dashboard/notifications` | `<NotificationBadge />` |

A chave i18n `"notifications"` foi adicionada em `src/messages/pt.json` e `src/messages/en.json` dentro do namespace `"sidebar"`.

---

## Modelo de Dados

### Notification

```typescript
interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'manual' | 'event' | 'scheduled';
  scope: 'broadcast' | 'targeted';
  tenant_ids: string[];
  event_key?: string;       // ex: 'lead.created'
  metadata?: Record<string, any>;
  send_email: boolean;
  scheduled_at?: string;
  published_at: string | null;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
```

### TenantNotificationReceipt

```typescript
interface TenantNotificationReceipt {
  id: string;
  notification_id: string;
  tenant_id: string;
  admin_id: string | null;   // null = agregado do tenant
  viewed: boolean;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  created_at: string;
  Notification?: Notification; // incluído no findForTenant
}
```

### TenantNotificationSettings

```typescript
interface TenantNotificationSettings {
  id: string;
  tenant_id: string;
  email_enabled: boolean;
  inapp_enabled: boolean;
  event_settings: Record<string, boolean>;
  cron_settings: Record<string, boolean>;
  timezone: string;   // IANA string derivada do Tenant (ex: "America/Sao_Paulo")
  created_at: string;
  updated_at: string;
}
```

> O campo `timezone` não é armazenado na tabela de settings — ele é derivado do model `Tenant` e mesclado na resposta de `GET /api/notifications/settings`.

---

## Fluxos Principais

### Fluxo 1 — Super admin cria e publica notificação

```
POST /api/notifications          → cria rascunho (published_at = null)
PATCH /api/notifications/:id     → edita enquanto for rascunho
POST /api/notifications/:id/publish
  → marca published_at = now()
  → cria TenantNotificationReceipt para cada tenant alvo
     (viewed = false, admin_id = null → agregado do tenant)
```

### Fluxo 2 — Tenant admin lê inbox

```
GET /api/notifications/tenant/me/unread-count   → polling 60s via useUnreadCount
GET /api/notifications/tenant                   → listagem com Notification aninhada
POST /api/notifications/tenant/:id/view
  → upsert receipt do admin (viewed = true, first_viewed_at = now())
  → upsert agregado do tenant (admin_id = null)
```

### Fluxo 3 — Evento automático (ex: lead criado)

```
LeadService.createCollectionLead(data, collection)
  → NotificationEventService.dispatch('lead.created', tenantId, { lead_id })
     → verifica NotificationSettings.isEventEnabled(tenantId, 'lead.created')
     → obtém timezone do tenant via NotificationSettingsService.getTenantTimezone(tenantId)
     → formata body com formatInTenantTimezone(now, timezone)
        ex: "Um novo lead foi registrado em sua conta em 26/05/2026 09:00 — America/Sao_Paulo (UTC-3)."
     → cria Notification (type=event, scope=targeted, published_at=now())
     → cria TenantNotificationReceipt (viewed=false)
```

### Fluxo 4 — Cron job (ex: assinatura vencendo)

```
NotificationSchedulerService @Cron('0 9 * * *')
  → findAllActiveTenantIds()
  → para cada tenant:
     → isCronEnabled(tenantId, 'subscription.expiry_check')
     → NotificationEventService.dispatch('subscription.expiring', tenantId)
```

---

## Adicionar Novo Evento de Notificação

Para adicionar um novo evento automático ao sistema:

### 1. Backend — Registrar a chave

Em `src/modules/zarp-notifications/domain/constants/notification-events.ts`:

```typescript
export const NOTIFICATION_EVENTS = {
  // ... existentes ...
  PAYMENT_FAILED: 'payment.failed',       // nova chave
} as const;
```

Adicionar também ao título e ao body builder em `notification-event.service.ts`:

```typescript
const EVENT_TITLES: Record<string, string> = {
  // ... existentes ...
  'payment.failed': 'Falha no pagamento',
};

// Em buildEventBody(), adicionar o novo case:
case 'payment.failed': {
  const invoiceDate = metadata?.invoice_date
    ? formatInTenantTimezone(new Date(metadata.invoice_date), timezone)
    : formatted;
  return `O pagamento da fatura de ${invoiceDate} não foi processado.`;
}
```

### 2. Backend — Disparar no serviço correto

```typescript
// Em qualquer serviço que importe ZarpNotificationsModule:
this.notificationEventService
  .dispatch(NOTIFICATION_EVENTS.PAYMENT_FAILED, tenantId, { invoice_id })
  .catch(() => {}); // fire-and-forget
```

### 3. Frontend — Adicionar ao formulário de configurações

Em `src/components/notifications/tenant-notification-settings-form.tsx`:

```typescript
const EVENT_KEYS = [
  'lead.created',
  'subscription.expiring',
  'subscription.expired',
  'payment.failed',  // nova chave
];
```

---

## Adicionar Novo Cron Job

### 1. Backend — Registrar a chave

Em `notification-events.ts`:

```typescript
export const CRON_KEYS = {
  // ... existentes ...
  PAYMENT_RETRY_CHECK: 'payment.retry_check',
} as const;
```

### 2. Backend — Criar o job

Em `notification-scheduler.service.ts`:

```typescript
@Cron('0 8 * * *')
async checkPaymentRetries() {
  const tenantIds = await this.notifRepo.findAllActiveTenantIds();
  for (const tenantId of tenantIds) {
    const enabled = await this.settingsService.isCronEnabled(tenantId, CRON_KEYS.PAYMENT_RETRY_CHECK);
    if (enabled) {
      await this.eventService.dispatch(NOTIFICATION_EVENTS.PAYMENT_FAILED, tenantId);
    }
  }
}
```

### 3. Frontend — Adicionar ao formulário

Em `tenant-notification-settings-form.tsx`:

```typescript
const CRON_KEYS_LIST = [
  'subscription.expiry_check',
  'subscription.expired_check',
  'payment.retry_check',  // nova chave
];
```

---

## Integrar o Módulo em Outro Módulo NestJS

Para usar `NotificationEventService` em um novo módulo:

### 1. Importar `ZarpNotificationsModule`

```typescript
// src/modules/meu-modulo/meu-modulo.module.ts
import { ZarpNotificationsModule } from '../zarp-notifications/zarp-notifications.module';

@Module({
  imports: [ZarpNotificationsModule],
  // ...
})
export class MeuModulo {}
```

### 2. Injetar o serviço

```typescript
import { NotificationEventService } from '../zarp-notifications/application/services/notification-event.service';
import { NOTIFICATION_EVENTS } from '../zarp-notifications/domain/constants/notification-events';

@Injectable()
export class MeuServico {
  constructor(
    private readonly notificationEventService: NotificationEventService,
  ) {}

  async minhaAcao(tenantId: string) {
    // ... lógica ...
    this.notificationEventService
      .dispatch(NOTIFICATION_EVENTS.LEAD_CREATED, tenantId, { extra: 'data' })
      .catch(() => {}); // nunca quebrar o fluxo principal
  }
}
```

---

## Erros Comuns

| Erro | Causa | Solução |
|---|---|---|
| `409 Conflict` ao publicar | Notificação já publicada | Verificar `published_at` antes de chamar publish |
| `409 Conflict` ao editar/deletar | Notificação já publicada | Apenas rascunhos podem ser modificados |
| `400 Bad Request` nas settings | Chave de evento/cron inválida | Usar apenas chaves registradas em `notification-events.ts` |
| `x-tenant-id` ausente | Header obrigatório não enviado | Os hooks (`useNotificationInbox`, etc.) já injetam o header automaticamente via `apiClient` |
| Badge não aparece | `tenantId` nulo | Badge lê do `useTenantStore`; verificar se o tenant está selecionado |

---

## Timezone por Tenant

Cada tenant possui um fuso horário próprio (IANA timezone string) usado para formatar datas em notificações in-app e de email.

### Configuração

O campo `timezone` é armazenado diretamente no model `Tenant`:

```prisma
model Tenant {
  // ...
  timezone String @default("America/Sao_Paulo") @db.VarChar(100)
}
```

Para atualizar o fuso de um tenant, use o endpoint existente de gerenciamento de tenants:

```
PATCH /api/tenants/:id
Authorization: Bearer <token>

{ "timezone": "America/New_York" }
```

Valores aceitos: qualquer IANA timezone string válida (ex: `"America/Sao_Paulo"`, `"America/New_York"`, `"Europe/Lisbon"`, `"Asia/Tokyo"`).

### Onde o timezone aparece

O endpoint `GET /api/notifications/settings` retorna o `timezone` do tenant mesclado na resposta:

```json
{
  "tenant_id": "tenant_abc",
  "email_enabled": true,
  "inapp_enabled": true,
  "event_settings": { "lead.created": true },
  "cron_settings": { "subscription.expiry_check": true },
  "timezone": "America/New_York"
}
```

O frontend não precisa de uma chamada extra — o hook `useNotificationSettings` já entrega o `timezone` junto com as demais configurações.

### Utilitário de formatação

**Arquivo:** [src/common/utils/format-timezone.ts](src/common/utils/format-timezone.ts)

```typescript
import { formatInTenantTimezone, formatDateInTenantTimezone } from '@/src/common/utils/format-timezone';

// Data e hora completas (padrão)
formatInTenantTimezone('2026-05-26T12:00:00Z', 'America/Sao_Paulo');
// → "26/05/2026 09:00 — America/Sao_Paulo (UTC-3)"

// Sem o offset UTC (opcional)
formatInTenantTimezone('2026-05-26T12:00:00Z', 'America/Sao_Paulo', { showUtcOffset: false });
// → "26/05/2026 09:00 — America/Sao_Paulo"

// Somente a data
formatDateInTenantTimezone('2026-05-26T12:00:00Z', 'America/Sao_Paulo');
// → "26/05/2026"
```

O offset UTC (`UTC-3`, `UTC+5:30`, etc.) é **derivado dinamicamente** a partir da IANA string usando `Intl.DateTimeFormat` com `timeZoneName: 'shortOffset'` — isso garante que DST seja respeitado automaticamente.

### NotificationInbox

O componente `NotificationInbox` usa `useNotificationSettings` para obter o timezone e formata todos os timestamps automaticamente:

```tsx
// Nenhuma prop necessária — timezone é lido das settings do tenant
<NotificationInbox />
```

Internamente:
```typescript
const { settings } = useNotificationSettings(tenantId);
const timezone = settings?.timezone ?? 'America/Sao_Paulo';

// Usado nas datas de cada receipt:
formatInTenantTimezone(item.first_viewed_at, timezone)
formatInTenantTimezone(item.Notification.published_at, timezone)
```

### Notificações de evento (backend)

`NotificationEventService.dispatch` busca o timezone do tenant antes de montar o corpo da notificação:

```typescript
const timezone = await this.settingsService.getTenantTimezone(tenantId);
const body = buildEventBody(eventKey, metadata, timezone);
```

Resultado para um tenant em `America/New_York`:
```
"Um novo lead foi registrado em sua conta em 26/05/2026 06:00 — America/New_York (UTC-4)."
```

### Adicionando timezone em novo evento

Ao criar um novo `case` em `buildEventBody` (em `notification-event.service.ts`), use sempre o parâmetro `timezone` recebido:

```typescript
case 'payment.failed': {
  const date = metadata?.invoice_date
    ? formatInTenantTimezone(new Date(metadata.invoice_date), timezone)
    : formatInTenantTimezone(new Date(), timezone);
  return `O pagamento da fatura de ${date} não foi processado.`;
}
```

O `timezone` é sempre a string IANA do tenant (ex: `"America/Sao_Paulo"`), nunca um offset fixo.
