# CMS Blog Integration - Frontend

Integração completa do sistema de Blog/CMS no frontend do ZARP Admin Dashboard.

## Arquitetura

A integração segue o padrão de arquitetura em camadas do projeto:

```
Pages → Hooks → Services → API
```

## Estrutura de Arquivos

### Types (`src/common/@types/`)
- `@blog.ts` - Tipos para Blog (Blog, BlogCreateInput, BlogUpdateInput, etc.)
- `@article.ts` - Tipos para Article (Article, ArticleCreateInput, PublicArticle, etc.)

### Services (`src/common/services/`)
- `blog-service.ts` - Comunicação com API de blogs
- `article-service.ts` - Comunicação com API de artigos (admin e pública)

### Hooks (`src/common/hooks/cms/`)

#### Blog Hooks
- `use-list-blogs.ts` - Listar blogs
- `use-get-blog.ts` - Obter blog específico
- `use-create-blog.ts` - Criar novo blog
- `use-update-blog.ts` - Atualizar blog
- `use-delete-blog.ts` - Deletar blog
- `use-regenerate-secret-key.ts` - Regenerar chave secreta

#### Article Hooks
- `use-list-articles.ts` - Listar artigos (admin)
- `use-get-article.ts` - Obter artigo (admin)
- `use-create-article.ts` - Criar artigo
- `use-update-article.ts` - Atualizar artigo
- `use-delete-article.ts` - Deletar artigo
- `use-list-public-articles.ts` - Listar artigos públicos (requer secret key)
- `use-get-public-article.ts` - Obter artigo público por slug (requer secret key)

### Components (`src/components/cms/`)
- `create-blog-dialog.tsx` - Modal para criar blog
- `secret-key-dialog.tsx` - Modal para exibir secret key (mostrado apenas uma vez)
- `blog-selector.tsx` - Seletor de blog (dropdown)

### Pages (`src/app/`)

#### Admin Pages
- `dashboard/cms/blogs/page.tsx` - Gerenciamento de blogs
- `dashboard/cms/articles/page.tsx` - Gerenciamento de artigos

#### Public Pages
- `public-blog/page.tsx` - Lista pública de artigos (requer secret key)
- `public-blog/[slug]/page.tsx` - Visualização de artigo público

## Funcionalidades Implementadas

### 1. Gerenciamento de Blogs

**Criar Blog:**
- Formulário com validação Zod
- Campos: title, slug, description
- Secret key gerada automaticamente
- Modal exibe secret key (apenas uma vez)

**Listar Blogs:**
- Cards com informações do blog
- Status (active/inactive)
- Ações: Regenerar key, Editar, Deletar

**Regenerar Secret Key:**
- Confirmação antes de regenerar
- Chave antiga é invalidada imediatamente
- Nova chave exibida em modal

**Deletar Blog:**
- Confirmação antes de deletar
- Ação irreversível

### 2. Gerenciamento de Artigos

**Listar Artigos:**
- Seletor de blog (obrigatório)
- Busca por título
- Tabela com status, título, slug, data de publicação
- Ações: Editar, Deletar

**Status de Artigos:**
- `draft` - Rascunho (amarelo)
- `published` - Publicado (verde)
- `archived` - Arquivado (cinza)

### 3. API Pública

**Endpoints Públicos:**
- `GET /cms/api/cms/public/articles` - Lista artigos publicados
- `GET /cms/api/cms/public/articles/:slug` - Obtém artigo por slug

**Autenticação:**
- Header: `x-blog-secret-key`
- Cada blog tem sua própria secret key
- Acesso isolado por blog

**Exemplo de Uso:**
```typescript
// Listar artigos
const { data } = useListPublicArticles(secretKey, { page: 1, limit: 10 });

// Obter artigo por slug
const { data } = useGetPublicArticle(secretKey, "article-slug");
```

## Páginas Públicas de Demonstração

### `/public-blog`
- Formulário para inserir secret key
- Lista artigos publicados
- Paginação
- Links para artigos individuais

### `/public-blog/[slug]`
- Visualização completa do artigo
- Imagens do artigo
- Data de publicação
- Botão voltar para lista

## Segurança

### Secret Key System
- Gerada automaticamente na criação do blog
- Formato: HMAC-SHA256 com salt
- Mostrada apenas uma vez
- Pode ser regenerada (invalida a anterior)
- Necessária para acessar API pública

### Isolamento
- Cada blog tem sua própria secret key
- API retorna apenas artigos do blog correspondente
- Artigos em draft/archived não são acessíveis publicamente

## Casos de Uso

### Caso 1: Blog Corporativo
```
1. Admin cria blog "Company News"
2. Secret key é gerada e salva
3. Admin cria artigos
4. Website corporativo usa secret key para listar artigos
5. Artigos são exibidos no site público
```

### Caso 2: Multi-tenant
```
Blog 1: "Tech Blog" (key A) → Site de tecnologia
Blog 2: "Product Updates" (key B) → Portal de produtos
Blog 3: "Developer Docs" (key C) → Documentação

Cada consumidor acessa apenas seu blog específico.
```

## Próximos Passos

### Funcionalidades Pendentes
1. Editor de artigos (página `/dashboard/cms/articles/[id]`)
2. Upload de imagens para artigos
3. Edição de blogs
4. Filtros avançados na lista de artigos
5. Preview de artigos antes de publicar
6. Agendamento de publicação
7. SEO metadata (meta_title, meta_description)
8. Paginação na lista de artigos admin

### Melhorias Sugeridas
1. Cache de artigos públicos (React Query)
2. Busca full-text em artigos
3. Tags/categorias para artigos
4. Analytics de visualizações
5. Comentários em artigos
6. RSS feed
7. Sitemap automático

## Exemplo de Integração Externa

### Next.js Website
```typescript
// app/blog/page.tsx
import { articleService } from '@/services/article-service';

export default async function BlogPage() {
  const articles = await articleService.listPublicArticles(
    process.env.BLOG_SECRET_KEY!,
    { page: 1, limit: 10 }
  );

  return (
    <div>
      {articles.data.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
```

### React SPA
```typescript
// components/BlogList.tsx
import { useListPublicArticles } from '@/hooks/use-list-public-articles';

export function BlogList() {
  const { data, isLoading } = useListPublicArticles(
    process.env.REACT_APP_BLOG_SECRET_KEY!
  );

  if (isLoading) return <Loader />;

  return (
    <div>
      {data?.data.map(article => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
```

## Variáveis de Ambiente

Adicione ao `.env.local`:

```bash
# API URL (já existente)
NEXT_PUBLIC_API_URL=https://api.example.com

# Blog Secret Key (para páginas públicas de demonstração)
NEXT_PUBLIC_BLOG_SECRET_KEY=your-secret-key-here
```

## Testes

### Testar Criação de Blog
1. Acesse `/dashboard/cms/blogs`
2. Clique em "Create New Blog"
3. Preencha: title, slug, description
4. Clique em "Create Blog"
5. Copie a secret key exibida

### Testar API Pública
1. Acesse `/public-blog`
2. Cole a secret key
3. Clique em "Load Articles"
4. Verifique lista de artigos
5. Clique em um artigo para visualizar

## Troubleshooting

### Erro: "Failed to load articles"
- Verifique se a secret key está correta
- Verifique se o blog existe e está ativo
- Verifique se há artigos publicados

### Erro: "Article Not Found"
- Verifique se o artigo está com status "published"
- Verifique se o slug está correto
- Verifique se a secret key corresponde ao blog do artigo

### Erro: "Network Error"
- Verifique se `NEXT_PUBLIC_API_URL` está configurado
- Verifique se a API está acessível
- Verifique logs do console para detalhes
