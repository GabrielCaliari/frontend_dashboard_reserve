# CMS Blog - Guia Rápido

## Início Rápido

### 1. Criar um Blog

```bash
# Acesse o dashboard
http://localhost:3000/dashboard/cms/blogs

# Clique em "Create New Blog"
# Preencha:
- Title: "Tech Blog"
- Slug: "tech-blog"
- Description: "Latest tech news and tutorials"

# Clique em "Create Blog"
# ⚠️ IMPORTANTE: Copie a secret key exibida (mostrada apenas uma vez!)
```

### 2. Criar Artigos

```bash
# Acesse a lista de artigos
http://localhost:3000/dashboard/cms/articles

# Selecione o blog criado
# Clique em "Write Article"
# (Funcionalidade de editor será implementada)
```

### 3. Consumir API Pública

#### Opção A: Página de Demonstração
```bash
# Acesse a página pública
http://localhost:3000/public-blog

# Cole a secret key
# Clique em "Load Articles"
```

#### Opção B: Integração Externa
```typescript
// Exemplo: Next.js
import axios from 'axios';

const API_URL = 'https://api.example.com';
const SECRET_KEY = 'your-secret-key';

// Listar artigos
const response = await axios.get(
  `${API_URL}/cms/api/cms/public/articles`,
  {
    headers: {
      'x-blog-secret-key': SECRET_KEY
    },
    params: {
      page: 1,
      limit: 10
    }
  }
);

// Obter artigo por slug
const article = await axios.get(
  `${API_URL}/cms/api/cms/public/articles/my-article-slug`,
  {
    headers: {
      'x-blog-secret-key': SECRET_KEY
    }
  }
);
```

## Estrutura de Resposta

### Lista de Artigos
```json
{
  "data": [
    {
      "id": 1,
      "title": "Getting Started",
      "slug": "getting-started",
      "content": "<p>Article content...</p>",
      "published_at": "2026-02-17T10:00:00Z",
      "display_order": 1,
      "images": [
        {
          "id": 1,
          "url": "https://storage.example.com/image.jpg",
          "alt_text": "Image description",
          "display_order": 1
        }
      ]
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "total_pages": 5
  }
}
```

### Artigo Individual
```json
{
  "id": 1,
  "title": "Getting Started",
  "slug": "getting-started",
  "content": "<p>Full article content...</p>",
  "published_at": "2026-02-17T10:00:00Z",
  "display_order": 1,
  "images": [...]
}
```

## Hooks Disponíveis

### Admin (Requer Autenticação)
```typescript
// Blogs
import { useListBlogs } from '@/src/common/hooks/cms/use-list-blogs';
import { useCreateBlog } from '@/src/common/hooks/cms/use-create-blog';
import { useDeleteBlog } from '@/src/common/hooks/cms/use-delete-blog';
import { useRegenerateSecretKey } from '@/src/common/hooks/cms/use-regenerate-secret-key';

// Artigos
import { useListArticles } from '@/src/common/hooks/cms/use-list-articles';
import { useCreateArticle } from '@/src/common/hooks/cms/use-create-article';
import { useDeleteArticle } from '@/src/common/hooks/cms/use-delete-article';
```

### Público (Requer Secret Key)
```typescript
import { useListPublicArticles } from '@/src/common/hooks/cms/use-list-public-articles';
import { useGetPublicArticle } from '@/src/common/hooks/cms/use-get-public-article';

// Uso
const { data, isLoading } = useListPublicArticles(secretKey, { page: 1, limit: 10 });
const { data: article } = useGetPublicArticle(secretKey, 'article-slug');
```

## Componentes Disponíveis

```typescript
// Dialogs
import { CreateBlogDialog } from '@/src/components/cms/create-blog-dialog';
import { SecretKeyDialog } from '@/src/components/cms/secret-key-dialog';

// Selectors
import { BlogSelector } from '@/src/components/cms/blog-selector';
```

## Fluxo de Trabalho

### Workflow Admin
```
1. Login → Dashboard
2. CMS → Blogs → Create Blog
3. Copiar Secret Key
4. CMS → Articles → Select Blog
5. Create Article
6. Publish Article
```

### Workflow Público
```
1. Obter Secret Key (do admin)
2. Fazer requisição com header x-blog-secret-key
3. Receber apenas artigos publicados
4. Exibir no site/app
```

## Segurança

### ✅ Boas Práticas
- Armazene secret key em variáveis de ambiente
- Nunca exponha secret key no código cliente
- Use HTTPS para todas as requisições
- Regenere secret key se comprometida

### ❌ Evite
- Commitar secret key no Git
- Expor secret key em URLs
- Compartilhar secret key publicamente
- Usar mesma key para múltiplos ambientes

## Troubleshooting

### Problema: Secret key não funciona
**Solução:**
- Verifique se copiou a key completa
- Verifique se o blog está ativo
- Tente regenerar a key

### Problema: Artigos não aparecem
**Solução:**
- Verifique se artigos estão com status "published"
- Verifique se está usando a secret key correta
- Verifique se o blog tem artigos

### Problema: Erro 401 Unauthorized
**Solução:**
- Verifique header `x-blog-secret-key`
- Verifique se a key não foi regenerada
- Verifique se o blog não foi deletado

## Próximos Passos

1. ✅ Criar blog
2. ✅ Obter secret key
3. ⏳ Implementar editor de artigos
4. ⏳ Criar artigos
5. ⏳ Publicar artigos
6. ✅ Consumir API pública
7. ⏳ Integrar em site externo

## Recursos

- [Documentação Completa](./CMS_BLOG_INTEGRATION.md)
- [Exemplos de API](./API_TESTING_GUIDE.md)
- [Arquitetura](./ARCHITECTURE_DIAGRAM.md)
