# Checklist de Migração - Dashboard ZARP

## ✅ Fase 1: Autenticação (Concluída)

- [x] Criar tipos TypeScript para autenticação (`@auth.ts`)
- [x] Atualizar configuração do Axios com interceptors
- [x] Migrar endpoint de login para `/auth/admin/authenticate`
- [x] Atualizar serviço de login
- [x] Atualizar action de login
- [x] Atualizar hook de autenticação
- [x] Criar serviço de perfil do admin
- [x] Criar serviço de tenants
- [x] Criar hooks para perfil e tenants
- [x] Criar hook de permissões
- [x] Criar utilitários de autenticação
- [x] Adicionar novos códigos de erro
- [x] Criar componente de seletor de tenant

## 🔄 Fase 2: Campanhas de Email (Pendente)

### Serviços a Migrar

- [ ] `src/common/services/email-campaign/create-email-campaign-service.ts`
  - Endpoint antigo: `/email-campaign`
  - Endpoint novo: `/mailer/campaigns`

- [ ] `src/common/services/email-campaign/list-email-campaign-service.ts`
  - Endpoint antigo: `/email-campaign`
  - Endpoint novo: `/mailer/campaigns`

- [ ] `src/common/services/email-campaign/list-email-campaign-by-id-service.ts`
  - Endpoint antigo: `/email-campaign/:id`
  - Endpoint novo: `/mailer/campaigns/:id`

- [ ] `src/common/services/email-campaign/update-email-campaign-copy-variant-service.ts`
  - Endpoint antigo: `/email-campaign/:id/copy-variant`
  - Endpoint novo: `/mailer/campaigns/:id/copy-variant`

- [ ] `src/common/services/email-campaign/upload-leads-service.ts`
  - Endpoint antigo: `/email-campaign/:id/leads`
  - Endpoint novo: `/mailer/campaigns/:id/leads`

- [ ] `src/common/services/email-campaign/start-campaign-service.ts`
  - Endpoint antigo: `/email-campaign/:id/start`
  - Endpoint novo: `/mailer/campaigns/:id/start`

- [ ] `src/common/services/email-campaign/close-setup-service.ts`
  - Endpoint antigo: `/email-campaign/:id/close-setup`
  - Endpoint novo: `/mailer/campaigns/:id/close-setup`

- [ ] `src/common/services/email-campaign/update-campaign-batch-size-service.ts`
  - Endpoint antigo: `/email-campaign/:id/batch-size`
  - Endpoint novo: `/mailer/campaigns/:id/batch-size`

- [ ] `src/common/services/email-campaign/list-batches-by-email-campaign-service.ts`
  - Endpoint antigo: `/email-campaign/:id/batches`
  - Endpoint novo: `/mailer/campaigns/:id/batches`

- [ ] `src/common/services/email-campaign/list-primary-copy-by-email-campaign-service.ts`
  - Endpoint antigo: `/email-campaign/:id/primary-copy`
  - Endpoint novo: `/mailer/campaigns/:id/primary-copy`

- [ ] `src/common/services/email-campaign/create-primary-copy-service.ts`
  - Endpoint antigo: `/email-campaign/:id/primary-copy`
  - Endpoint novo: `/mailer/campaigns/:id/primary-copy`

- [ ] `src/common/services/email-campaign/update-metrics-service.ts`
  - Endpoint antigo: `/email-campaign/:id/metrics`
  - Endpoint novo: `/mailer/campaigns/:id/metrics`

### Campaign Batch Services

- [ ] `src/common/services/campaign-batch/list-deliveries-by-campaign-batch-id-service.ts`
  - Endpoint antigo: `/campaign-batch/:id/deliveries`
  - Endpoint novo: `/mailer/batches/:id/deliveries`

- [ ] `src/common/services/campaign-batch/list-email-by-campaign-batch-id-service.ts`
  - Endpoint antigo: `/campaign-batch/:id/emails`
  - Endpoint novo: `/mailer/batches/:id/emails`

- [ ] `src/common/services/campaign-batch/update-campaign-batch-email-service.ts`
  - Endpoint antigo: `/campaign-batch/:id/email`
  - Endpoint novo: `/mailer/batches/:id/email`

- [ ] `src/common/services/campaign-batch/update-copy-email-by-campaign-batch-id-service.ts`
  - Endpoint antigo: `/campaign-batch/:id/copy`
  - Endpoint novo: `/mailer/batches/:id/copy`

## 🔄 Fase 3: SMTP Servers (Pendente)

- [ ] `src/common/services/smtp-server/list-smtp-servers-services.ts`
  - Endpoint antigo: `/smtp-servers`
  - Endpoint novo: `/mailer/smtp-servers`

## 🔄 Fase 4: Leads (Pendente)

- [ ] `src/common/services/list-leads-service.ts`
  - Endpoint antigo: `/leads`
  - Endpoint novo: `/auth/leads`

- [ ] `src/common/services/list-lead-qualification-service.ts`
  - Endpoint antigo: `/leads/qualification`
  - Endpoint novo: `/auth/leads/qualification`

- [ ] `src/common/services/update-lead-qualification-service.ts`
  - Endpoint antigo: `/leads/:id/qualification`
  - Endpoint novo: `/auth/leads/:id/qualification`

- [ ] `src/common/services/complete-screening-service.ts`
  - Endpoint antigo: `/leads/:id/complete-screening`
  - Endpoint novo: `/auth/leads/:id/complete-screening`

- [ ] `src/common/services/temperature-analysis-by-message-id-service.ts`
  - Endpoint antigo: `/leads/temperature-analysis/:messageId`
  - Endpoint novo: `/auth/leads/temperature-analysis/:messageId`

## 🔄 Fase 5: Brand Analytics (Pendente)

- [ ] `src/common/services/brand-analytics-service.ts`
  - Endpoint antigo: `/brand-analytics`
  - Endpoint novo: `/brands/analytics`

- [ ] `src/common/services/brand-analytics-detail-service.ts`
  - Endpoint antigo: `/brand-analytics/:id`
  - Endpoint novo: `/brands/analytics/:id`

- [ ] `src/common/services/create-brand-analytics.ts`
  - Endpoint antigo: `/brand-analytics`
  - Endpoint novo: `/brands/analytics`

## 🔄 Fase 6: States (Pendente)

- [ ] `src/common/services/states-service.ts`
  - Endpoint antigo: `/states`
  - Endpoint novo: `/cnpjs/states` ou `/journals/states` (verificar contexto)

## 🔄 Fase 7: Actions (Pendente)

Após migrar os serviços, atualizar as actions correspondentes:

- [ ] `src/common/actions/email-campaign/create-email-campaign.tsx`
- [ ] `src/common/actions/email-campaign/update-campaign-batch-size.tsx`
- [ ] `src/common/actions/email-campaign/update-email-campaign-copy-variant.tsx`
- [ ] `src/common/actions/email-campaign/upload-leads.ts`
- [ ] `src/common/actions/smtp-server/list-smtp-servers.tsx`
- [ ] `src/common/actions/list-leads.ts`
- [ ] `src/common/actions/list-lead-qualification.ts`
- [ ] `src/common/actions/update-lead-qualification.ts`
- [ ] `src/common/actions/complete-screening.ts`
- [ ] `src/common/actions/temperature-analysis-by-message-id.ts`

## 🔄 Fase 8: Hooks (Pendente)

Após migrar actions, atualizar os hooks:

- [ ] `src/common/hooks/use-list-leads.ts`
- [ ] `src/common/hooks/use-update-lead-qualification.ts`
- [ ] `src/common/hooks/use-complete-screening.ts`
- [ ] `src/common/hooks/use-temperature-analysis-by-message-id.ts`

## 🔄 Fase 9: Componentes e Páginas (Pendente)

- [ ] Atualizar página de login (`src/app/auth/login/page.tsx`)
- [ ] Adicionar seletor de tenant no layout
- [ ] Atualizar componentes de campanha
- [ ] Atualizar componentes de leads
- [ ] Adicionar verificação de permissões em páginas protegidas

## 🔄 Fase 10: Testes (Pendente)

- [ ] Testar fluxo completo de login
- [ ] Testar requisições autenticadas
- [ ] Testar expiração de sessão (401)
- [ ] Testar permissões (403)
- [ ] Testar multi-tenancy
- [ ] Testar criação de campanha
- [ ] Testar upload de leads
- [ ] Testar listagem de SMTP servers
- [ ] Testar qualificação de leads

## 📝 Notas de Implementação

### Padrão de Migração de Serviços

```typescript
// Antes
const response = await api.get('/email-campaign');

// Depois
const response = await api.get('/mailer/campaigns');
```

### Padrão de Migração com Parâmetros

```typescript
// Antes
const response = await api.get(`/email-campaign/${id}`);

// Depois
const response = await api.get(`/mailer/campaigns/${id}`);
```

### Verificação de Permissões em Páginas

```typescript
import usePermissions from '@/src/common/hooks/use-permissions';

export default function AdminPage() {
  const { canManageAdmins } = usePermissions();

  if (!canManageAdmins) {
    return <div>Acesso negado</div>;
  }

  return <div>Conteúdo da página</div>;
}
```

## 🚀 Como Continuar

1. **Iniciar pela Fase 2**: Migrar serviços de campanhas de email
2. **Testar cada serviço**: Usar a API em `localhost:3002` para validar
3. **Atualizar actions**: Após confirmar que serviços funcionam
4. **Atualizar hooks**: Após confirmar que actions funcionam
5. **Atualizar UI**: Por último, atualizar componentes e páginas

## 📚 Recursos

- Manual completo: `docs/manual-atualizacao-client-nextjs.md`
- Resumo da migração: `docs/MIGRATION_SUMMARY.md`
- Swagger da API: `http://localhost:3002/api/docs`
