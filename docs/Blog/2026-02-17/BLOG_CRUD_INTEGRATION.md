# Blog CRUD Integration - Complete Documentation

## Overview

Integração completa do CRUD de Blogs seguindo a arquitetura do projeto com Single Responsibility Principle (SRP) bem definido.

## Architecture Layers

### 1. Types Layer (`src/common/@types/@blog.ts`)
- Define interfaces TypeScript para Blog
- Tipos para Create, Update, List e Response
- ✅ Já existente

### 2. Schema Layer (`src/common/schemas/blog-schema.ts`)
- Validação com Zod para create e update
- Regras de validação:
  - Title: obrigatório, max 255 caracteres
  - Description: obrigatório
  - Slug: obrigatório, lowercase com hyphens, regex validation
  - Status: enum 'active' | 'inactive'
- ✅ Criado

### 3. Service Layer (`src/common/services/blog-service.ts`)
- Comunicação com API via axios
- Endpoints:
  - `GET /cms/blogs` - List blogs (paginado)
  - `GET /cms/blogs/:id` - Get single blog
  - `POST /cms/blogs` - Create blog
  - `PUT /cms/blogs/:id` - Update blog
  - `DELETE /cms/blogs/:id` - Delete blog
  - `POST /cms/blogs/:id/regenerate-key` - Regenerate secret key
- ✅ Já existente

### 4. Hooks Layer (`src/common/hooks/cms/`)

#### useListBlogs
- React Query para listagem paginada
- Cache key: `['blogs', tenantId, page, limit]`
- ✅ Já existente

#### useGetBlog
- React Query para buscar blog individual
- Cache key: `['blog', tenantId, blogId]`
- ✅ Já existente

#### useCreateBlog
- Mutation para criar blog
- Invalida cache de listagem após sucesso
- ✅ Já existente

#### useUpdateBlog
- Mutation para atualizar blog
- Invalida cache de listagem e detalhe após sucesso
- ✅ Criado

#### useDeleteBlog
- Mutation para deletar blog
- Invalida cache de listagem após sucesso
- ✅ Já existente

#### useRegenerateSecretKey
- Mutation para regenerar chave secreta
- Invalida cache do blog específico após sucesso
- ✅ Criado

### 5. Component Layer (`src/components/cms/`)

#### CreateBlogDialog
- Dialog para criar novo blog
- Form com React Hook Form + Zod validation
- Auto-geração de slug a partir do título
- Callback onSuccess com secret_key
- ✅ Criado

#### EditBlogDialog
- Dialog para editar blog existente
- Form com React Hook Form + Zod validation
- Suporta alteração de status (active/inactive)
- ✅ Criado

#### SecretKeyDialog
- Dialog para exibir secret key gerada
- Copy to clipboard functionality
- Warning sobre salvar a chave
- Instruções de uso
- ✅ Criado

### 6. Page Layer (`src/app/dashboard/cms/blogs/page.tsx`)
- Listagem de blogs em grid cards
- Integração com todos os dialogs
- Tenant isolation (x-tenant-id header)
- Loading states e empty states
- Confirmação para delete e regenerate key
- ✅ Atualizado

## API Integration

### Base Configuration
```typescript
// src/common/config/api.ts
- Interceptor adiciona x-tenant-id header automaticamente
- Interceptor adiciona Authorization Bearer token
- Interceptor adiciona session-id header
```

### Endpoints (Swagger: http://localhost:3002/api/docs)
```
GET    /cms/blogs              - List blogs (tenant isolated)
GET    /cms/blogs/:id          - Get blog details
POST   /cms/blogs              - Create blog (returns secret_key)
PUT    /cms/blogs/:id          - Update blog
DELETE /cms/blogs/:id          - Delete blog
POST   /cms/blogs/:id/regenerate-key - Regenerate secret key
```

## Single Responsibility Principle (SRP)

### Clear Separation of Concerns

1. **Types** - Define data structures
2. **Schemas** - Validate input data
3. **Services** - Handle API communication
4. **Hooks** - Manage React Query state and mutations
5. **Components** - Handle UI and user interactions
6. **Pages** - Orchestrate components and business logic

### Benefits

- ✅ Fácil manutenção
- ✅ Testabilidade individual de cada camada
- ✅ Reutilização de código
- ✅ Baixo acoplamento
- ✅ Alta coesão

## Features Implemented

### Create Blog
- Form validation com Zod
- Auto-geração de slug
- Exibição de secret key após criação
- Invalidação de cache

### Read Blogs
- Listagem paginada
- Grid responsivo
- Status badge (active/inactive)
- Loading e empty states
- Tenant isolation

### Update Blog
- Form pré-preenchido
- Validação com Zod
- Alteração de status
- Invalidação de cache

### Delete Blog
- Confirmação antes de deletar
- Invalidação de cache
- Feedback visual

### Regenerate Secret Key
- Confirmação antes de regenerar
- Exibição da nova chave
- Warning sobre invalidação da chave antiga
- Invalidação de cache

## Security Features

- ✅ Tenant isolation via x-tenant-id header
- ✅ Authentication via Bearer token
- ✅ Session management via session-id header
- ✅ Secret key gerada apenas uma vez (não armazenada no frontend)
- ✅ Confirmação para ações destrutivas

## UI/UX Features

- ✅ Dark theme consistency
- ✅ Loading states
- ✅ Empty states
- ✅ Error handling
- ✅ Success feedback
- ✅ Copy to clipboard
- ✅ Responsive design
- ✅ Accessible components (Radix UI)

## Testing Checklist

### Manual Testing
- [ ] Criar blog com dados válidos
- [ ] Criar blog com dados inválidos (validação)
- [ ] Listar blogs
- [ ] Editar blog
- [ ] Alterar status do blog
- [ ] Deletar blog
- [ ] Regenerar secret key
- [ ] Copiar secret key para clipboard
- [ ] Verificar tenant isolation
- [ ] Verificar paginação

### API Testing
- [ ] Verificar headers (x-tenant-id, Authorization, session-id)
- [ ] Verificar responses da API
- [ ] Verificar error handling (401, 403, 404, 500)

## Next Steps

1. Implementar paginação completa na UI
2. Adicionar filtros (status, search)
3. Adicionar sorting
4. Implementar bulk actions
5. Adicionar analytics de blogs
6. Implementar preview de blog público

## Related Documentation

- [API Testing Guide](./API_TESTING_GUIDE.md)
- [Architecture Diagram](./ARCHITECTURE_DIAGRAM.md)
- [CMS Integration](./CMS_BLOG_INTEGRATION.md)
- [Tenant Isolation](./TENANT_ISOLATION.md)

## Swagger Documentation

Acesse a documentação completa da API em:
```
http://localhost:3002/api/docs
```

Procure pela seção "CMS - Blogs" para ver todos os endpoints disponíveis.
