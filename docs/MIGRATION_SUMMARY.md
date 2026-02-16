# Resumo da Migração - Nova Arquitetura DDD

## Arquivos Criados

### Types
- `src/common/@types/@auth.ts` - Tipos TypeScript para autenticação (LoginCredentials, AuthResponse, AdminProfile, Tenant, AdminRole)

### Services
- `src/common/services/admin-profile.ts` - Serviço para buscar perfil do admin
- `src/common/services/tenant.ts` - Serviço para listar tenants do admin

### Actions
- `src/common/actions/admin-profile.tsx` - Server action para perfil
- `src/common/actions/tenant.tsx` - Server action para tenants

### Hooks
- `src/common/hooks/use-admin-profile.ts` - Hook para gerenciar perfil do admin
- `src/common/hooks/use-tenants.ts` - Hook para gerenciar lista de tenants
- `src/common/hooks/use-permissions.ts` - Hook para verificação de permissões baseado em roles

### Utils
- `src/common/utils/auth.ts` - Utilitários para limpar cookies e logout

### Components
- `src/components/tenant-selector.tsx` - Componente para seleção de tenant

## Arquivos Modificados

### Configuração
- `src/common/config/api.ts` - Adicionados interceptors para:
  - Injetar automaticamente headers `Authorization` e `session-id`
  - Tratar erro 401 e redirecionar para login
  - Limpar cookies em caso de sessão expirada

- `src/common/config/error-types.ts` - Adicionados novos códigos de erro:
  - `403:ADMIN_ACCOUNT_DEACTIVATED`
  - `403:INSUFFICIENT_PERMISSIONS`
  - `404:TENANT_NOT_FOUND`

### Autenticação
- `src/common/services/admin-login.ts` - Atualizado para:
  - Usar novo endpoint `/auth/admin/authenticate`
  - Usar tipos do `@auth.ts`
  - Retornar `AuthResponse` tipado

- `src/common/actions/admin-login.tsx` - Atualizado para usar `LoginCredentials`

- `src/common/hooks/use-user-authentication.ts` - Atualizado para:
  - Armazenar `session-email` e `session-role` em cookies
  - Usar tipos do `@auth.ts`

## Mudanças Principais

### 1. Endpoint de Login
**Antes:** `/admin/authenticate`  
**Agora:** `/auth/admin/authenticate`

### 2. Headers de Autenticação
Todas as requisições autenticadas agora enviam automaticamente:
- `Authorization: Bearer <token>`
- `session-id: <session_id>`

### 3. Cookies Armazenados
- `token` - JWT session_token
- `session-code` - ID numérico da sessão
- `session-name` - Nome do admin
- `session-email` - Email do admin (novo)
- `session-role` - Role do admin (novo)

### 4. Roles de Admin
```typescript
enum AdminRole {
  super_admin = 'super_admin',
  company_admin = 'company_admin',
  tenant_admin = 'tenant_admin',
}
```

### 5. Multi-tenancy
O sistema agora suporta múltiplos tenants por admin:
- Endpoint: `/auth/tenants/my-tenants`
- Perfil do admin inclui lista de tenants
- Componente `TenantSelector` para seleção

## Como Usar

### 1. Login
```typescript
import useAdminAuthentication from '@/src/common/hooks/use-user-authentication';

const { execAdminAuthentication } = useAdminAuthentication();

const handleLogin = async () => {
  const success = await execAdminAuthentication({
    email: 'admin@example.com',
    password: 'senha123'
  });
  
  if (success) {
    // Redirecionar para dashboard
  }
};
```

### 2. Buscar Perfil
```typescript
import useAdminProfile from '@/src/common/hooks/use-admin-profile';

const { profile, loading, error } = useAdminProfile();

// profile contém: name, email, role, active, tenants[]
```

### 3. Listar Tenants
```typescript
import useTenants from '@/src/common/hooks/use-tenants';

const { tenants, loading, error } = useTenants();
```

### 4. Verificar Permissões
```typescript
import usePermissions from '@/src/common/hooks/use-permissions';

const { 
  isSuperAdmin, 
  canManageAdmins, 
  canManageTenants 
} = usePermissions();

if (canManageAdmins) {
  // Mostrar interface de gestão de admins
}
```

### 5. Logout
```typescript
import { logout } from '@/src/common/utils/auth';

const handleLogout = () => {
  logout(); // Limpa cookies e redireciona para /auth/login
};
```

## Próximos Passos

### Endpoints a Migrar
Outros endpoints que precisam ser atualizados conforme o manual:

| Endpoint Antigo | Endpoint Novo | Contexto |
|----------------|---------------|----------|
| `/v1/brands/*` | `/brands/*` | Brands |
| `/v1/companies/*` | `/cnpjs/*` | CNPJs |
| `/v1/journals/*` | `/journals/*` | Journals |
| `/v1/leads/*` | `/auth/leads/*` | Auth (Leads) |
| `/v1/campaigns/*` | `/mailer/*` | Mailer |

### Tarefas Pendentes
1. ✅ Atualizar autenticação de admin
2. ✅ Adicionar suporte a multi-tenancy
3. ✅ Implementar sistema de permissões
4. ⏳ Migrar endpoints de campanhas de email
5. ⏳ Migrar endpoints de leads
6. ⏳ Migrar endpoints de SMTP servers
7. ⏳ Atualizar componentes de UI para usar novos hooks
8. ⏳ Adicionar tratamento de erro 403 (permissões)
9. ⏳ Implementar seletor de tenant no layout
10. ⏳ Testar fluxo completo com API rodando

## Notas Importantes

1. **Interceptors Automáticos**: Os headers de autenticação são injetados automaticamente pelo axios interceptor em `api.ts`

2. **Tratamento de 401**: Sessões expiradas são tratadas automaticamente com limpeza de cookies e redirecionamento

3. **Cookies vs LocalStorage**: O projeto usa cookies (via `cookies-next`) para armazenar dados de sessão

4. **Server Actions**: Mantida a arquitetura de server actions do Next.js 16

5. **Compatibilidade**: A estrutura existente foi preservada, apenas adicionando novos recursos

## Testando a Migração

Quando a API estiver rodando em `localhost:3002`:

1. Testar login em `/auth/login`
2. Verificar se cookies são armazenados corretamente
3. Testar requisições autenticadas
4. Verificar redirecionamento em caso de 401
5. Testar listagem de tenants (se aplicável)
6. Verificar permissões baseadas em role

## Documentação da API

Swagger disponível em: `http://localhost:3002/api/docs`
