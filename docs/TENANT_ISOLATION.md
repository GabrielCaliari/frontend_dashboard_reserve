# Tenant Isolation - CMS Blog System

## Overview

O sistema de CMS Blog implementa isolamento completo por tenant, garantindo que cada tenant (empresa/organização) tenha acesso apenas aos seus próprios blogs e artigos.

## Arquitetura

### Global State Management (Zustand)

**Store:** `src/common/stores/tenant-store.ts`

```typescript
interface TenantState {
  selectedTenant: Tenant | null;
  setSelectedTenant: (tenant: Tenant | null) => void;
  clearSelectedTenant: () => void;
}
```

**Características:**
- Persistência em localStorage
- Estado global acessível em toda aplicação
- Hooks auxiliares para facilitar uso

### Hooks Auxiliares

```typescript
// Obter tenant ID selecionado
const tenantId = useSelectedTenantId();

// Verificar se há tenant selecionado
const hasSelectedTenant = useHasSelectedTenant();

// Obter tenant completo
const selectedTenant = useTenantStore((state) => state.selectedTenant);
```

## Componentes

### TenantSelector

**Localização:** `src/components/tenant-selector.tsx`

**Funcionalidades:**
- Carrega lista de tenants do usuário
- Persiste seleção em localStorage
- Auto-seleciona primeiro tenant se nenhum estiver selecionado
- Exibe no sidebar para fácil acesso

**Uso:**
```tsx
<TenantSelector />
```

## Fluxo de Dados

### 1. Seleção de Tenant

```
Usuário seleciona tenant no dropdown
    ↓
TenantSelector atualiza store Zustand
    ↓
Estado persiste em localStorage
    ↓
Todas as páginas/hooks reagem à mudança
```

### 2. Requisições API

```
Hook é chamado (ex: useListBlogs)
    ↓
Hook obtém tenantId da store
    ↓
Service adiciona tenant_id na requisição
    ↓
API retorna apenas dados do tenant
```

## Implementação por Camada

### Services Layer

Todos os serviços recebem `tenantId` como primeiro parâmetro:

```typescript
// blog-service.ts
async listBlogs(tenantId: number, page = 1, limit = 10) {
  const response = await api.get('/cms/blogs', {
    params: { tenant_id: tenantId, page, limit },
  });
  return response.data;
}
```

### Hooks Layer

Hooks obtêm `tenantId` automaticamente da store:

```typescript
// use-list-blogs.ts
export function useListBlogs(page = 1, limit = 10) {
  const tenantId = useSelectedTenantId();

  return useQuery({
    queryKey: ['blogs', tenantId, page, limit],
    queryFn: () => blogService.listBlogs(tenantId!, page, limit),
    enabled: !!tenantId, // Só executa se tenant estiver selecionado
  });
}
```

### Pages Layer

Páginas verificam se há tenant selecionado e exibem aviso se necessário:

```typescript
export default function BlogsPage() {
  const hasSelectedTenant = useHasSelectedTenant();
  const selectedTenant = useTenantStore((state) => state.selectedTenant);

  if (!hasSelectedTenant) {
    return <TenantSelectionWarning />;
  }

  // Resto da página...
}
```

## Segurança

### Client-Side

1. **Validação de Tenant:**
   - Hooks só executam se `tenantId` estiver presente
   - Páginas exibem aviso se nenhum tenant selecionado

2. **Query Keys:**
   - Incluem `tenantId` para cache isolado
   - Evita vazamento de dados entre tenants

3. **Persistência:**
   - localStorage mantém seleção entre sessões
   - Limpo no logout

### Server-Side

1. **API Validation:**
   - Backend valida se usuário tem acesso ao tenant
   - Retorna 403 se acesso negado

2. **Query Filtering:**
   - Todas queries filtram por `tenant_id`
   - Impossível acessar dados de outro tenant

## Exemplos de Uso

### Criar Blog

```typescript
// Hook automaticamente usa tenant da store
const { mutate: createBlog } = useCreateBlog();

createBlog({
  title: "Tech Blog",
  slug: "tech-blog",
  description: "Latest tech news"
});

// Service adiciona tenant_id automaticamente
// POST /cms/blogs
// Body: { title, slug, description, tenant_id: 123 }
```

### Listar Artigos

```typescript
// Hook obtém tenant_id da store
const { data } = useListArticles(blogId, 1, 10);

// Service faz requisição com tenant_id
// GET /cms/blogs/5/articles?tenant_id=123&page=1&limit=10
```

### Trocar Tenant

```typescript
const { setSelectedTenant } = useTenantStore();

// Usuário seleciona outro tenant
setSelectedTenant(newTenant);

// React Query invalida cache automaticamente
// Novas requisições usam novo tenant_id
```

## Cache Management

### React Query Keys

Todas as query keys incluem `tenantId`:

```typescript
// Blogs
['blogs', tenantId, page, limit]
['blog', tenantId, blogId]

// Articles
['articles', tenantId, blogId, page, limit]
['article', tenantId, blogId, articleId]
```

### Invalidação

Ao trocar tenant, o cache é automaticamente isolado:

```typescript
// Tenant A
queryKey: ['blogs', 1, 1, 10] // Cache A

// Usuário troca para Tenant B
queryKey: ['blogs', 2, 1, 10] // Cache B (novo)
```

## UI/UX

### Indicadores Visuais

1. **Sidebar:**
   - TenantSelector sempre visível
   - Mostra tenant atual

2. **Páginas:**
   - Header mostra tenant atual
   - Aviso se nenhum tenant selecionado

3. **Loading States:**
   - Skeleton enquanto carrega tenants
   - Disabled state se sem tenant

### Mensagens de Erro

```typescript
// Sem tenant selecionado
<AlertCircle />
"No Tenant Selected"
"Please select a tenant from the sidebar"

// Sem blogs no tenant
<Globe />
"No blogs yet"
"Create your first blog to get started"
```

## Testes

### Cenários de Teste

1. **Seleção de Tenant:**
   - [ ] Selecionar tenant atualiza store
   - [ ] Seleção persiste em localStorage
   - [ ] Auto-seleciona primeiro tenant

2. **Isolamento de Dados:**
   - [ ] Blogs de Tenant A não aparecem em Tenant B
   - [ ] Artigos de Tenant A não aparecem em Tenant B
   - [ ] Cache isolado por tenant

3. **Navegação:**
   - [ ] Trocar tenant atualiza dados
   - [ ] Voltar à página mantém tenant
   - [ ] Refresh mantém tenant selecionado

4. **Segurança:**
   - [ ] API rejeita tenant_id inválido
   - [ ] Não é possível acessar dados de outro tenant
   - [ ] Logout limpa tenant selecionado

## Troubleshooting

### Problema: Dados não carregam

**Causa:** Nenhum tenant selecionado
**Solução:** Verificar se `hasSelectedTenant` é true

### Problema: Dados de outro tenant aparecem

**Causa:** Cache não foi invalidado
**Solução:** Verificar query keys incluem `tenantId`

### Problema: Tenant não persiste

**Causa:** localStorage não está funcionando
**Solução:** Verificar permissões do navegador

## Migração de Código Existente

### Antes (Sem Tenant Isolation)

```typescript
// Service
async listBlogs(page = 1, limit = 10) {
  return await api.get('/cms/blogs', { params: { page, limit } });
}

// Hook
export function useListBlogs(page = 1, limit = 10) {
  return useQuery({
    queryKey: ['blogs', page, limit],
    queryFn: () => blogService.listBlogs(page, limit),
  });
}
```

### Depois (Com Tenant Isolation)

```typescript
// Service
async listBlogs(tenantId: number, page = 1, limit = 10) {
  return await api.get('/cms/blogs', {
    params: { tenant_id: tenantId, page, limit }
  });
}

// Hook
export function useListBlogs(page = 1, limit = 10) {
  const tenantId = useSelectedTenantId();
  
  return useQuery({
    queryKey: ['blogs', tenantId, page, limit],
    queryFn: () => blogService.listBlogs(tenantId!, page, limit),
    enabled: !!tenantId,
  });
}
```

## Conclusão

O sistema de tenant isolation garante:

✅ Segurança - Dados isolados por tenant
✅ Performance - Cache otimizado por tenant
✅ UX - Indicadores visuais claros
✅ Manutenibilidade - Padrão consistente em toda aplicação
✅ Escalabilidade - Suporta múltiplos tenants sem conflitos
