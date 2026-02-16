# Guia de Início Rápido

## 🎯 Objetivo

Este guia ajuda você a começar rapidamente com a nova arquitetura DDD da API ZARP.

## ⚡ Setup Rápido (5 minutos)

### 1. Verificar Ambiente

```bash
# Verificar se o projeto está atualizado
cd frontend_dashboard_zarp-admin
git pull
npm install
```

### 2. Verificar Variáveis de Ambiente

```bash
# Verificar .env.local
cat .env.local
```

Deve conter:
```env
NEXT_PUBLIC_API_URL=http://localhost:3002
NEXT_PUBLIC_API_EMAIL_URL=http://localhost:3004
```

### 3. Iniciar Servidores

```bash
# Terminal 1: API Backend
cd backend_api_zarp-admin
npm run dev

# Terminal 2: Frontend
cd frontend_dashboard_zarp-admin
npm run dev
```

### 4. Testar Login

1. Abrir `http://localhost:3000/auth/login`
2. Fazer login com credenciais de teste
3. Verificar se cookies foram armazenados (DevTools > Application > Cookies)

## 📋 Checklist de Verificação

- [ ] API rodando em `http://localhost:3002`
- [ ] Frontend rodando em `http://localhost:3000`
- [ ] Swagger acessível em `http://localhost:3002/api/docs`
- [ ] Login funcionando
- [ ] Cookies sendo armazenados (`token`, `session-code`, etc)
- [ ] Redirecionamento para dashboard após login

## 🔍 O Que Mudou?

### Antes vs Depois

#### Endpoint de Login
```typescript
// ❌ Antes
POST /admin/authenticate

// ✅ Agora
POST /auth/admin/authenticate
```

#### Headers de Autenticação
```typescript
// ❌ Antes - Manual
headers: {
  Authorization: `Bearer ${token}`
}

// ✅ Agora - Automático
// Headers injetados automaticamente pelo interceptor
```

#### Cliente API
```typescript
// ❌ Antes
import apiEmail from "../../config/api-email";

// ✅ Agora
import api from "../../config/api";
```

## 🎓 Conceitos Principais

### 1. Autenticação Dupla

A API agora requer **dois valores** para autenticação:

```typescript
// Resposta do login
{
  session_id: 123,           // ID numérico
  session_token: "eyJ...",   // JWT token
  details: { name, email, role }
}

// Headers enviados automaticamente
Authorization: Bearer eyJ...
session-id: 123
```

### 2. Interceptors Automáticos

O cliente API injeta headers automaticamente:

```typescript
// src/common/config/api.ts
api.interceptors.request.use((config) => {
  // Lê cookies e injeta headers
  config.headers.Authorization = `Bearer ${token}`;
  config.headers['session-id'] = sessionId;
  return config;
});
```

### 3. Bounded Contexts

A API está organizada por contextos:

```
/auth/*      → Autenticação, admins, users, tenants, leads
/mailer/*    → Campanhas de email, batches, SMTP
/brands/*    → Marcas, analytics, monitoramento
/cnpjs/*     → Dados de empresas
/journals/*  → Diários oficiais
```

### 4. Multi-tenancy

Admins podem ter acesso a múltiplos tenants:

```typescript
const { tenants } = useAdminProfile();
// tenants = [
//   { id: 1, name: "Empresa X" },
//   { id: 2, name: "Empresa Y" }
// ]
```

### 5. Sistema de Permissões

Três níveis de acesso:

```typescript
const { 
  isSuperAdmin,      // Acesso total
  isCompanyAdmin,    // Acesso a empresa
  isTenantAdmin      // Acesso a tenant
} = usePermissions();
```

## 🛠️ Ferramentas Disponíveis

### Hooks Novos

```typescript
// Autenticação
import useAdminAuthentication from '@/src/common/hooks/use-user-authentication';

// Perfil
import useAdminProfile from '@/src/common/hooks/use-admin-profile';

// Tenants
import useTenants from '@/src/common/hooks/use-tenants';

// Permissões
import usePermissions from '@/src/common/hooks/use-permissions';
```

### Utilitários

```typescript
// Logout
import { logout } from '@/src/common/utils/auth';
logout(); // Limpa cookies e redireciona
```

### Componentes

```typescript
// Seletor de tenant
import TenantSelector from '@/src/components/tenant-selector';
<TenantSelector />
```

## 📝 Exemplo Prático

### Criar uma Página Protegida

```typescript
'use client'

import usePermissions from '@/src/common/hooks/use-permissions';
import useAdminProfile from '@/src/common/hooks/use-admin-profile';

export default function ProtectedPage() {
  const { canManageCampaigns } = usePermissions();
  const { profile, loading } = useAdminProfile();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!canManageCampaigns) {
    return <div>Acesso negado</div>;
  }

  return (
    <div>
      <h1>Bem-vindo, {profile?.name}</h1>
      <p>Role: {profile?.role}</p>
      {/* Conteúdo da página */}
    </div>
  );
}
```

### Fazer uma Requisição Autenticada

```typescript
// 1. Criar o serviço
import api from '@/src/common/config/api';

export async function listCampaignsService() {
  const response = await api.get('/mailer/campaigns');
  return response.data;
}

// 2. Criar a action
'use server'
export async function listCampaigns() {
  return listCampaignsService();
}

// 3. Criar o hook
'use client'
import { useState, useEffect } from 'react';

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

// 4. Usar no componente
export default function CampaignsPage() {
  const { campaigns, loading } = useCampaigns();
  
  if (loading) return <div>Carregando...</div>;
  
  return (
    <div>
      {campaigns.map(c => <div key={c.id}>{c.name}</div>)}
    </div>
  );
}
```

## 🚀 Próximos Passos

### Fase 1: Familiarização (Você está aqui!)
- [x] Setup do ambiente
- [x] Entender conceitos principais
- [x] Testar login

### Fase 2: Migração de Serviços
1. Escolher um serviço para migrar (ex: `list-email-campaign-service.ts`)
2. Seguir o guia em `MIGRATION_EXAMPLE.md`
3. Testar o serviço
4. Atualizar action e hook correspondentes

### Fase 3: Atualização de UI
1. Adicionar verificação de permissões em páginas
2. Implementar seletor de tenant (se necessário)
3. Atualizar componentes para usar novos hooks

### Fase 4: Testes
1. Testar fluxo completo de login
2. Testar requisições autenticadas
3. Testar expiração de sessão
4. Testar permissões

## 📚 Documentação Completa

Para mais detalhes, consulte:

- **Visão Geral**: `docs/README.md`
- **Diagramas**: `docs/ARCHITECTURE_DIAGRAM.md`
- **Manual Completo**: `docs/manual-atualizacao-client-nextjs.md`
- **Checklist**: `docs/MIGRATION_CHECKLIST.md`
- **Exemplos**: `docs/MIGRATION_EXAMPLE.md`
- **Referência**: `docs/QUICK_REFERENCE.md`
- **Comandos**: `docs/DEV_COMMANDS.md`

## 🆘 Problemas Comuns

### Erro 401 ao fazer requisição

**Causa**: Cookies não estão sendo enviados

**Solução**:
1. Verificar se cookies existem (DevTools > Application > Cookies)
2. Fazer logout e login novamente
3. Verificar se está usando `api` ao invés de `apiEmail`

### Headers não estão sendo injetados

**Causa**: Usando cliente API errado

**Solução**:
```typescript
// ❌ Errado
import apiEmail from "../../config/api-email";

// ✅ Correto
import api from "../../config/api";
```

### Endpoint retorna 404

**Causa**: Endpoint não foi atualizado

**Solução**:
1. Consultar tabela de mapeamento em `MIGRATION_EXAMPLE.md`
2. Verificar Swagger em `http://localhost:3002/api/docs`

### API não está rodando

**Solução**:
```bash
cd backend_api_zarp-admin
npm run dev
```

## 💡 Dicas

1. **Sempre consulte o Swagger** antes de fazer uma requisição
2. **Use o DevTools** para verificar cookies e headers
3. **Teste incrementalmente** - migre um serviço por vez
4. **Faça commits frequentes** após cada migração bem-sucedida
5. **Mantenha a documentação aberta** durante o desenvolvimento

## ✅ Você Está Pronto!

Agora você tem tudo que precisa para começar a trabalhar com a nova arquitetura. Boa sorte! 🚀

---

**Precisa de ajuda?** Consulte a documentação completa em `docs/README.md`
