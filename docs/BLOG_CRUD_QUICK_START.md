# Blog CRUD - Quick Start Guide

## 🚀 Como Usar

### 1. Acessar a Página de Blogs

```
http://localhost:3000/dashboard/cms/blogs
```

### 2. Criar um Novo Blog

1. Clique no botão "Create New Blog"
2. Preencha os campos:
   - **Title**: Nome do blog (ex: "Tech Blog")
   - **Slug**: Gerado automaticamente (ex: "tech-blog")
   - **Description**: Descrição do blog
3. Clique em "Create Blog"
4. **IMPORTANTE**: Copie e salve a secret key exibida

### 3. Editar um Blog

1. Clique no ícone de edição (lápis) no card do blog
2. Modifique os campos desejados
3. Altere o status se necessário (Active/Inactive)
4. Clique em "Update Blog"

### 4. Deletar um Blog

1. Clique no ícone de lixeira no card do blog
2. Confirme a ação no dialog
3. O blog será removido permanentemente

### 5. Regenerar Secret Key

1. Clique no botão "Key" no card do blog
2. Confirme a ação (a chave antiga será invalidada)
3. **IMPORTANTE**: Copie e salve a nova secret key

## 📋 Estrutura de Arquivos Criados

```
src/
├── common/
│   ├── hooks/cms/
│   │   ├── use-update-blog.ts          ✅ NOVO
│   │   ├── use-regenerate-secret-key.ts ✅ NOVO
│   │   └── index.ts                     ✅ NOVO
│   └── schemas/
│       └── blog-schema.ts               ✅ NOVO
│
├── components/cms/
│   ├── create-blog-dialog.tsx           ✅ NOVO
│   ├── edit-blog-dialog.tsx             ✅ NOVO
│   ├── secret-key-dialog.tsx            ✅ NOVO
│   └── index.ts                         ✅ NOVO
│
└── app/dashboard/cms/blogs/
    └── page.tsx                         ✅ ATUALIZADO

docs/
├── BLOG_CRUD_INTEGRATION.md             ✅ NOVO
└── BLOG_CRUD_QUICK_START.md             ✅ NOVO
```

## 🔧 Arquivos Já Existentes (Reutilizados)

```
src/
├── common/
│   ├── @types/@blog.ts                  ✅ Existente
│   ├── services/blog-service.ts         ✅ Existente
│   └── hooks/cms/
│       ├── use-list-blogs.ts            ✅ Existente
│       ├── use-get-blog.ts              ✅ Existente
│       ├── use-create-blog.ts           ✅ Existente
│       └── use-delete-blog.ts           ✅ Existente
```

## 🎯 Responsabilidades por Camada

### Types (`@blog.ts`)
```typescript
// Define estruturas de dados
interface Blog { ... }
interface BlogCreateInput { ... }
interface BlogUpdateInput { ... }
```

### Schemas (`blog-schema.ts`)
```typescript
// Valida dados de entrada
export const blogCreateSchema = z.object({ ... });
export const blogUpdateSchema = z.object({ ... });
```

### Services (`blog-service.ts`)
```typescript
// Comunica com API
export const blogService = {
  listBlogs: (page, limit) => api.get('/cms/blogs'),
  createBlog: (data) => api.post('/cms/blogs', data),
  updateBlog: (id, data) => api.put(`/cms/blogs/${id}`, data),
  // ...
};
```

### Hooks (`use-*.ts`)
```typescript
// Gerencia estado React Query
export function useCreateBlog() {
  return useMutation({
    mutationFn: (data) => blogService.createBlog(data),
    onSuccess: () => queryClient.invalidateQueries(['blogs']),
  });
}
```

### Components (`*-dialog.tsx`)
```typescript
// UI e interação do usuário
export function CreateBlogDialog({ open, onOpenChange }) {
  const { mutate } = useCreateBlog();
  const { handleSubmit } = useForm({ resolver: zodResolver(blogCreateSchema) });
  // ...
}
```

### Pages (`page.tsx`)
```typescript
// Orquestra componentes
export default function BlogsPage() {
  const { data } = useListBlogs();
  const { mutate: deleteBlog } = useDeleteBlog();
  // ...
}
```

## 🔐 Headers Automáticos

Todos os requests incluem automaticamente:

```typescript
headers: {
  'Authorization': 'Bearer <token>',
  'session-id': '<session-code>',
  'x-tenant-id': '<tenant-id>',
}
```

Configurado em: `src/common/config/api.ts`

## 📝 Validação de Formulários

### Create Blog
```typescript
{
  title: string (required, max 255),
  slug: string (required, lowercase-with-hyphens),
  description: string (required)
}
```

### Update Blog
```typescript
{
  title?: string (optional, max 255),
  slug?: string (optional, lowercase-with-hyphens),
  description?: string (optional),
  status?: 'active' | 'inactive' (optional)
}
```

## 🧪 Testando a Integração

### 1. Via UI (Frontend)
```bash
npm run dev
# Acesse: http://localhost:3000/dashboard/cms/blogs
```

### 2. Via Swagger (API)
```bash
# Acesse: http://localhost:3002/api/docs
# Procure por: CMS - Blogs
```

### 3. Via cURL
```bash
# List blogs
curl -X GET "http://localhost:3002/cms/blogs?page=1&limit=10" \
  -H "Authorization: Bearer <token>" \
  -H "x-tenant-id: <tenant-id>"

# Create blog
curl -X POST "http://localhost:3002/cms/blogs" \
  -H "Authorization: Bearer <token>" \
  -H "x-tenant-id: <tenant-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Blog",
    "slug": "my-blog",
    "description": "Blog description"
  }'
```

## ⚠️ Pontos de Atenção

1. **Secret Key**: Só é exibida uma vez após criação/regeneração
2. **Tenant Isolation**: Blogs são isolados por tenant (x-tenant-id)
3. **Slug Validation**: Apenas lowercase e hyphens são permitidos
4. **Delete**: Ação irreversível, sempre confirme
5. **Regenerate Key**: Invalida a chave anterior imediatamente

## 🎨 UI Components Utilizados

Todos os componentes são do Radix UI (já existentes no projeto):

- `Dialog` - Modals
- `Button` - Botões
- `Input` - Campos de texto
- `Textarea` - Campos de texto multi-linha
- `Select` - Dropdown de seleção
- `Label` - Labels de formulário
- `Alert` - Alertas e avisos
- `Card` - Cards de conteúdo

## 📚 Próximos Passos

1. Testar criação de blog
2. Testar edição de blog
3. Testar deleção de blog
4. Testar regeneração de secret key
5. Verificar tenant isolation
6. Implementar paginação completa
7. Adicionar filtros e busca
8. Adicionar testes unitários

## 🐛 Troubleshooting

### Erro: "No Tenant Selected"
**Solução**: Selecione um tenant no sidebar antes de acessar a página

### Erro: 401 Unauthorized
**Solução**: Faça login novamente em `/auth/login`

### Erro: 404 Not Found
**Solução**: Verifique se a API está rodando em `http://localhost:3002`

### Slug inválido
**Solução**: Use apenas letras minúsculas, números e hyphens (ex: "my-blog-123")

## 📖 Documentação Relacionada

- [Documentação Completa](./BLOG_CRUD_INTEGRATION.md)
- [API Testing Guide](./API_TESTING_GUIDE.md)
- [Swagger API](http://localhost:3002/api/docs)
