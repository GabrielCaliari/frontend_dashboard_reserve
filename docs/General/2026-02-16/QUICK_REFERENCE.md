# Referência Rápida - Migração API

## Mudanças Principais

### 1. Cliente API
```typescript
// ❌ Antes
import apiEmail from "../../config/api-email";

// ✅ Depois
import api from "../../config/api";
```

### 2. Headers de Autenticação
```typescript
// ❌ Antes - Manual
const response = await apiEmail.get("/endpoint", {
  headers: {
    Authorization: `Bearer ${token}`,
  }
});

// ✅ Depois - Automático (via interceptor)
const response = await api.get("/endpoint");
// Headers Authorization e session-id são injetados automaticamente
```

### 3. Endpoints

#### Email Campaigns
```typescript
// ❌ Antes
"/email-campaign"
"/email-campaign/:id"

// ✅ Depois
"/mailer/campaigns"
"/mailer/campaigns/:id"
```

#### Campaign Batches
```typescript
// ❌ Antes
"/campaign-batch/:id"

// ✅ Depois
"/mailer/batches/:id"
```

#### SMTP Servers
```typescript
// ❌ Antes
"/smtp-servers"

// ✅ Depois
"/mailer/smtp-servers"
```

#### Leads
```typescript
// ❌ Antes
"/leads"

// ✅ Depois
"/auth/leads"
```

#### Admin Auth
```typescript
// ❌ Antes
"/admin/authenticate"
"/admin/me"

// ✅ Depois
"/auth/admin/authenticate"
"/auth/admin/me"
```

## Novos Recursos

### 1. Tipos de Autenticação
```typescript
import { 
  LoginCredentials, 
  AuthResponse, 
  AdminProfile, 
  Tenant,
  AdminRole 
} from '@/src/common/@types/@auth';
```

### 2. Hooks Disponíveis
```typescript
// Autenticação
import useAdminAuthentication from '@/src/common/hooks/use-user-authentication';

// Perfil do admin
import useAdminProfile from '@/src/common/hooks/use-admin-profile';

// Lista de tenants
import useTenants from '@/src/common/hooks/use-tenants';

// Verificação de permissões
import usePermissions from '@/src/common/hooks/use-permissions';
```

### 3. Utilitários
```typescript
import { logout, clearAuthCookies } from '@/src/common/utils/auth';

// Fazer logout
logout(); // Limpa cookies e redireciona para /auth/login

// Apenas limpar cookies
clearAuthCookies();
```

### 4. Verificação de Permissões
```typescript
const { 
  isSuperAdmin,
  isCompanyAdmin,
  isTenantAdmin,
  canManageAdmins,
  canManageTenants,
  canViewReports,
  canManageCampaigns
} = usePermissions();

if (!canManageCampaigns) {
  return <div>Acesso negado</div>;
}
```

## Cookies Armazenados

| Cookie | Descrição | Exemplo |
|--------|-----------|---------|
| `token` | JWT session_token | `eyJhbGciOiJIUzI1NiIs...` |
| `session-code` | ID numérico da sessão | `123` |
| `session-name` | Nome do admin | `João Silva` |
| `session-email` | Email do admin | `joao@zarp.com.br` |
| `session-role` | Role do admin | `company_admin` |

## Roles de Admin

```typescript
enum AdminRole {
  super_admin = 'super_admin',      // Acesso total
  company_admin = 'company_admin',  // Admin de empresa
  tenant_admin = 'tenant_admin',    // Admin de tenant
}
```

## Códigos de Erro Novos

```typescript
// 403 - Forbidden
'403:ADMIN_ACCOUNT_DEACTIVATED'
'403:INSUFFICIENT_PERMISSIONS'

// 404 - Not Found
'404:TENANT_NOT_FOUND'
```

## Padrão de Resposta da API

### Sucesso
```json
{
  "data": { ... }
}
```

### Erro
```json
{
  "code": "401:ADMIN_TOKEN_INVALID",
  "message": "Token inválido"
}
```

## Exemplo Completo de Migração

### Serviço
```typescript
// ❌ Antes
import apiEmail from "../../config/api-email";

export async function listCampaignsService() {
  const response = await apiEmail.get("/email-campaign");
  return response.data;
}

// ✅ Depois
import api from "../../config/api";

export async function listCampaignsService() {
  const response = await api.get("/mailer/campaigns");
  return response.data;
}
```

### Action
```typescript
'use server'

import { listCampaignsService } from '../services/email-campaign/list-email-campaign-service';

export async function listCampaigns() {
  return listCampaignsService();
}
```

### Hook
```typescript
'use client'

import { useState, useEffect } from 'react';
import { listCampaigns } from '../actions/email-campaign/list-campaigns';

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCampaigns()
      .then(setCampaigns)
      .finally(() => setLoading(false));
  }, []);

  return { campaigns, loading };
}
```

### Componente
```typescript
'use client'

import { useCampaigns } from '@/src/common/hooks/use-campaigns';
import usePermissions from '@/src/common/hooks/use-permissions';

export default function CampaignsPage() {
  const { campaigns, loading } = useCampaigns();
  const { canManageCampaigns } = usePermissions();

  if (!canManageCampaigns) {
    return <div>Acesso negado</div>;
  }

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div>
      {campaigns.map(campaign => (
        <div key={campaign.id}>{campaign.name}</div>
      ))}
    </div>
  );
}
```

## Comandos Úteis

```bash
# Iniciar API
cd backend_api_zarp-admin
npm run dev

# Iniciar Frontend
cd frontend_dashboard_zarp-admin
npm run dev

# Ver documentação da API
# Abrir http://localhost:3002/api/docs no navegador

# Lint
npm run lint
```

## Troubleshooting

### Erro 401 - Unauthorized
- Verificar se cookies estão sendo armazenados
- Verificar se interceptor está funcionando
- Fazer logout e login novamente

### Erro 404 - Not Found
- Verificar se endpoint foi atualizado corretamente
- Consultar Swagger da API
- Verificar se API está rodando

### Erro 403 - Forbidden
- Verificar role do usuário
- Verificar se tem permissão para a ação
- Verificar se conta está ativa

### Headers não estão sendo enviados
- Verificar se está usando `api` ao invés de `apiEmail`
- Verificar se cookies existem
- Verificar console do navegador

## Links Úteis

- Manual completo: `docs/manual-atualizacao-client-nextjs.md`
- Resumo: `docs/MIGRATION_SUMMARY.md`
- Checklist: `docs/MIGRATION_CHECKLIST.md`
- Exemplo: `docs/MIGRATION_EXAMPLE.md`
- Swagger: `http://localhost:3002/api/docs`
