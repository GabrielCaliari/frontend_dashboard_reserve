# Correção: Header x-tenant-id

## Problema Identificado

O backend esperava o header `x-tenant-id` em todas as requisições para identificar o contexto do tenant, mas o frontend não estava enviando esse header. Isso causava erros 403 ou respostas vazias quando superadmins tentavam acessar recursos de tenants específicos.

## Solução Implementada

### 1. Axios Interceptor Atualizado

Adicionamos o header `x-tenant-id` automaticamente em todas as requisições através dos interceptors do axios.

**Arquivos modificados:**
- `src/common/config/api.ts`
- `src/common/config/api-email.ts`

**Implementação:**
```typescript
// Request interceptor - Adiciona headers de autenticação e tenant
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // ... código de token e session-id ...

      // Adicionar x-tenant-id do localStorage (Zustand persist)
      try {
        const tenantStorage = localStorage.getItem('tenant-storage');
        if (tenantStorage) {
          const { state } = JSON.parse(tenantStorage);
          if (state?.selectedTenant?.id) {
            config.headers['x-tenant-id'] = state.selectedTenant.id.toString();
          }
        }
      } catch (error) {
        console.warn('Failed to read tenant from storage:', error);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
```

### 2. Services Simplificados

Removemos o parâmetro `tenantId` de todos os métodos dos services, já que o header é enviado automaticamente.

**Antes:**
```typescript
async listBlogs(tenantId: number, page = 1, limit = 10) {
  const response = await api.get('/cms/blogs', {
    params: { tenant_id: tenantId, page, limit },
  });
  return response.data;
}
```

**Depois:**
```typescript
async listBlogs(page = 1, limit = 10) {
  const response = await api.get('/cms/blogs', {
    params: { page, limit },
  });
  return response.data;
}
```

### 3. Hooks Simplificados

Removemos a passagem do `tenantId` para os services, mantendo apenas para as query keys do React Query.

**Antes:**
```typescript
export function useListBlogs(page = 1, limit = 10) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['blogs', tenantId, page, limit],
    queryFn: () => blogService.listBlogs(tenantId!, page, limit),
    enabled: !!tenantId,
  });
}
```

**Depois:**
```typescript
export function useListBlogs(page = 1, limit = 10) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['blogs', tenantId, page, limit],
    queryFn: () => blogService.listBlogs(page, limit),
    enabled: !!tenantId,
  });
}
```

### 4. TenantSelector Corrigido

Corrigimos o componente para usar a API correta do NextUI Select e torná-lo reativo.

**Problemas corrigidos:**
- `selectedKeys` deve ser um `Set`, não um array
- Usar `onSelectionChange` ao invés de `onChange`
- Separar os hooks do Zustand para melhor reatividade

**Implementação:**
```typescript
const selectedTenant = useTenantStore((state) => state.selectedTenant);
const setSelectedTenant = useTenantStore((state) => state.setSelectedTenant);

const handleSelectionChange = (keys: any) => {
  const selectedKey = Array.from(keys)[0] as string;
  if (selectedKey) {
    const tenant = tenants.find((t) => t.id.toString() === selectedKey);
    if (tenant) {
      setSelectedTenant(tenant);
    }
  }
};

<Select
  selectedKeys={selectedTenant ? new Set([selectedTenant.id.toString()]) : new Set()}
  onSelectionChange={handleSelectionChange}
  // ...
/>
```

## Fluxo de Requisição

### Antes (Quebrado)
```
1. Usuário seleciona tenant no sidebar
2. Store Zustand atualiza
3. Hook faz requisição
4. Service envia: GET /cms/blogs?page=1&limit=10
5. Headers: Authorization, session-id
6. Backend: ❌ 403 Forbidden (falta x-tenant-id)
```

### Depois (Funcionando)
```
1. Usuário seleciona tenant no sidebar
2. Store Zustand atualiza (persiste em localStorage)
3. Hook faz requisição
4. Axios interceptor lê tenant do localStorage
5. Service envia: GET /cms/blogs?page=1&limit=10
6. Headers: Authorization, session-id, x-tenant-id: 123
7. Backend: ✅ 200 OK (retorna dados do tenant)
```

## Headers Enviados

Todas as requisições agora incluem:

```http
Authorization: Bearer <token>
session-id: <session_id>
x-tenant-id: <tenant_id>
Content-Type: application/json
```

## Benefícios

### 1. Automático
- Não precisa passar `tenantId` manualmente em cada chamada
- Interceptor adiciona automaticamente baseado na store

### 2. Consistente
- Todas as requisições incluem o header
- Impossível esquecer de enviar o tenant

### 3. Simples
- Services mais limpos (menos parâmetros)
- Hooks mais simples (menos lógica)

### 4. Seguro
- Backend valida o header em todas as requisições
- Impossível acessar dados de outro tenant

## Arquivos Modificados

### Interceptors (2)
- ✅ `src/common/config/api.ts`
- ✅ `src/common/config/api-email.ts`

### Services (2)
- ✅ `src/common/services/blog-service.ts`
- ✅ `src/common/services/article-service.ts`

### Hooks (11)
- ✅ `src/common/hooks/cms/use-list-blogs.ts`
- ✅ `src/common/hooks/cms/use-get-blog.ts`
- ✅ `src/common/hooks/cms/use-create-blog.ts`
- ✅ `src/common/hooks/cms/use-update-blog.ts`
- ✅ `src/common/hooks/cms/use-delete-blog.ts`
- ✅ `src/common/hooks/cms/use-regenerate-secret-key.ts`
- ✅ `src/common/hooks/cms/use-list-articles.ts`
- ✅ `src/common/hooks/cms/use-get-article.ts`
- ✅ `src/common/hooks/cms/use-create-article.ts`
- ✅ `src/common/hooks/cms/use-update-article.ts`
- ✅ `src/common/hooks/cms/use-delete-article.ts`

### Components (1)
- ✅ `src/components/tenant-selector.tsx`

## Testes

### Verificar Header
```bash
# Abrir DevTools → Network
# Selecionar um tenant
# Fazer qualquer requisição
# Verificar Request Headers:
# ✅ x-tenant-id: 123
```

### Verificar Reatividade
```bash
# 1. Selecionar Tenant A
# 2. Ver blogs do Tenant A
# 3. Selecionar Tenant B
# 4. Ver blogs do Tenant B (deve atualizar automaticamente)
```

### Verificar Persistência
```bash
# 1. Selecionar um tenant
# 2. Refresh da página (F5)
# 3. Tenant deve continuar selecionado
# 4. Requisições devem incluir x-tenant-id correto
```

## Troubleshooting

### Problema: Header não está sendo enviado
**Causa:** localStorage não tem o tenant
**Solução:** Selecionar um tenant no sidebar

### Problema: Tenant não persiste após refresh
**Causa:** localStorage bloqueado ou limpo
**Solução:** Verificar permissões do navegador

### Problema: Seletor não atualiza visualmente
**Causa:** NextUI Select precisa de Set, não array
**Solução:** Já corrigido - usar `new Set([id])`

## Exemplo de Uso

### PowerShell (Teste Manual)
```powershell
# Login
$auth = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" `
  -Method POST `
  -Body (@{email="admin@example.com"; password="password"} | ConvertTo-Json) `
  -ContentType "application/json"

# Listar tenants
$tenants = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/tenants/my-tenants" `
  -Method GET `
  -Headers @{
    "Authorization" = "Bearer $($auth.session_token)"
    "session-id" = $auth.session_id
  }

# Listar blogs (COM x-tenant-id)
$blogs = Invoke-RestMethod -Uri "http://localhost:3000/api/cms/blogs" `
  -Method GET `
  -Headers @{
    "Authorization" = "Bearer $($auth.session_token)"
    "session-id" = $auth.session_id
    "x-tenant-id" = $tenants[0].id  # ✅ IMPORTANTE!
  }
```

## Conclusão

O sistema agora envia automaticamente o header `x-tenant-id` em todas as requisições, garantindo:

✅ Isolamento correto por tenant
✅ Código mais limpo e simples
✅ Impossível esquecer de enviar o header
✅ Seletor de tenant reativo e funcional
✅ Persistência entre sessões

O problema do desenvolvedor júnior está resolvido - o frontend agora envia o header que o backend espera!
