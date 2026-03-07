# Guia Completo de Troubleshooting: Criação de Artigos

## Diagnóstico Rápido - Checklist de Verificação

Antes de investigar a fundo, verifique rapidamente:

- [ ] Você tem um token JWT válido de administrador?
- [ ] Seu usuário tem role `editor` ou superior?
- [ ] O header `x-tenant-id` está presente e correto?
- [ ] O `blogId` na URL existe e pertence ao seu tenant?
- [ ] O campo `title` tem entre 1 e 255 caracteres?
- [ ] O campo `content` não está vazio?
- [ ] Os headers `Authorization` e `Content-Type` estão corretos?

---

## Anatomia da Requisição de Criação

### Endpoint Completo
```
POST /api/cms/blogs/{blogId}/articles
```

### Headers Obrigatórios
```
Authorization: Bearer {seu-token-jwt}
x-tenant-id: {seu-tenant-id}
Content-Type: application/json
```

### Body Obrigatório
```json
{
  "title": "Título do Artigo",
  "content": "Conteúdo completo do artigo"
}
```

---

## Camadas de Validação (Ordem de Execução)

### Camada 1: Guards de Autenticação (Executam ANTES do controller)

#### 1.1 AdminJwtGuard
**O que valida**: Token JWT no header Authorization

**Falha se**:
- Header `Authorization` ausente
- Token malformado (não começa com "Bearer ")
- Token expirado
- Token inválido (assinatura incorreta)
- Payload do token não contém dados de admin

**Erro retornado**: 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Como resolver**:
1. Verifique se você fez login recentemente
2. Confirme que o token não expirou
3. Verifique o formato: `Authorization: Bearer eyJhbGc...`
4. Tente fazer login novamente para obter novo token

---

#### 1.2 TenantGuard
**O que valida**: Header x-tenant-id e associação do admin ao tenant

**Falha se**:
- Header `x-tenant-id` ausente
- Tenant ID não é um número válido
- Admin não pertence ao tenant especificado
- Tenant não existe ou está inativo

**Erro retornado**: 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Access denied: Invalid tenant"
}
```

**Como resolver**:
1. Adicione o header: `x-tenant-id: 5` (use seu tenant ID real)
2. Confirme que seu usuário está associado a esse tenant
3. Verifique se o tenant está ativo no sistema
4. Consulte o endpoint de perfil do admin para ver seu tenant_id

---

#### 1.3 RolesGuard
**O que valida**: Permissão de role do administrador

**Falha se**:
- Admin tem role `viewer` (somente leitura)
- Role requerida: `editor` ou superior

**Erro retornado**: 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions. Required role: editor"
}
```

**Hierarquia de roles aceitas**:
- ✅ super_admin (acesso total)
- ✅ owner (dono do tenant)
- ✅ manager (gerente)
- ✅ editor (editor de conteúdo)
- ❌ viewer (somente visualização)

**Como resolver**:
1. Solicite ao owner/manager que eleve sua role para `editor`
2. Verifique sua role atual no perfil do admin
3. Se você é owner, pode alterar roles de outros admins

---

### Camada 2: Validação de Parâmetros de URL

#### 2.1 blogId (Path Parameter)
**O que valida**: ID do blog na URL deve ser um número inteiro válido

**Falha se**:
- blogId não é um número (ex: `/blogs/abc/articles`)
- blogId é negativo ou zero
- blogId é um decimal (ex: `/blogs/1.5/articles`)

**Erro retornado**: 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed (numeric string is expected)",
  "error": "Bad Request"
}
```

**Como resolver**:
1. Confirme que a URL usa um ID numérico válido
2. Exemplo correto: `/api/cms/blogs/5/articles`
3. Exemplo incorreto: `/api/cms/blogs/meu-blog/articles`

---

### Camada 3: Validação do Body (DTO)

#### 3.1 Campo `title`
**Validações aplicadas**:
- Deve ser uma string
- Não pode ser vazio ou apenas espaços
- Máximo de 255 caracteres

**Falha se**:
```json
// title ausente
{}

// title vazio
{ "title": "" }

// title não é string
{ "title": 123 }

// title muito longo
{ "title": "a".repeat(256) }
```

**Erros retornados**:
```json
{
  "statusCode": 400,
  "message": [
    "title should not be empty",
    "title must be a string",
    "title must be shorter than or equal to 255 characters"
  ],
  "error": "Bad Request"
}
```

**Como resolver**:
1. Sempre envie o campo `title`
2. Garanta que tem entre 1 e 255 caracteres
3. Use string, não número ou objeto
4. Remova espaços extras no início/fim

---

#### 3.2 Campo `content`
**Validações aplicadas**:
- Deve ser uma string
- Não pode ser vazio

**Falha se**:
```json
// content ausente
{ "title": "Título" }

// content vazio
{ "title": "Título", "content": "" }

// content não é string
{ "title": "Título", "content": null }
```

**Erros retornados**:
```json
{
  "statusCode": 400,
  "message": [
    "content should not be empty",
    "content must be a string"
  ],
  "error": "Bad Request"
}
```

**Como resolver**:
1. Sempre envie o campo `content`
2. Pode ser HTML, Markdown ou texto puro
3. Não há limite de tamanho definido
4. Não pode ser string vazia

---

### Camada 4: Validações de Negócio

#### 4.1 Blog Existe?
**O que valida**: O blog especificado no blogId existe no banco de dados

**Falha se**:
- Blog não existe
- Blog foi deletado (soft delete)
- Blog pertence a outro tenant

**Erro retornado**: 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Blog not found"
}
```

**Como resolver**:
1. Liste todos os blogs do seu tenant: `GET /blogs`
2. Confirme que o blogId existe na lista
3. Verifique se você está usando o tenant correto
4. Se o blog foi deletado, não é possível criar artigos nele

---

#### 4.2 Geração de Slug Único
**O que acontece**: Sistema gera slug automaticamente a partir do título

**Processo**:
1. Converte título para lowercase
2. Remove acentos e caracteres especiais
3. Substitui espaços por hífens
4. Se slug já existe, adiciona sufixo numérico

**Exemplos**:
```
"Meu Primeiro Artigo" → "meu-primeiro-artigo"
"Artigo Duplicado" (já existe) → "artigo-duplicado-2"
"Artigo Duplicado" (já existe -2) → "artigo-duplicado-3"
```

**Não pode falhar**: O sistema sempre encontra um slug único adicionando números

---

## Erros Comuns e Soluções

### Erro 1: "Unauthorized" (401)

**Sintomas**:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Causas possíveis**:
1. Token JWT ausente no header
2. Token expirado
3. Token inválido ou corrompido
4. Header Authorization malformado

**Diagnóstico**:
```bash
# Verifique se o header está presente
curl -I https://api.exemplo.com/api/cms/blogs/1/articles

# Decodifique o token JWT (sem validar assinatura)
# Use jwt.io para inspecionar o payload
```

**Solução**:
1. Faça login novamente para obter novo token
2. Verifique o formato: `Authorization: Bearer {token}`
3. Confirme que não há espaços extras
4. Verifique a data de expiração do token

---

### Erro 2: "Access denied: Invalid tenant" (403)

**Sintomas**:
```json
{
  "statusCode": 403,
  "message": "Access denied: Invalid tenant"
}
```

**Causas possíveis**:
1. Header `x-tenant-id` ausente
2. Tenant ID incorreto
3. Admin não pertence ao tenant
4. Tenant inativo

**Diagnóstico**:
```bash
# Verifique seu tenant ID
GET /api/auth/me
# Resposta contém: { "tenant_id": 5, ... }
```

**Solução**:
1. Adicione header: `x-tenant-id: {seu-tenant-id}`
2. Use o tenant_id do seu perfil de admin
3. Confirme que você está associado ao tenant
4. Contate o administrador se não tiver acesso

---

### Erro 3: "Insufficient permissions" (403)

**Sintomas**:
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions. Required role: editor"
}
```

**Causas possíveis**:
1. Sua role é `viewer` (somente leitura)
2. Você não tem permissão para criar artigos

**Diagnóstico**:
```bash
# Verifique sua role
GET /api/auth/me
# Resposta contém: { "role": "viewer", ... }
```

**Solução**:
1. Solicite ao owner/manager que eleve sua role para `editor`
2. Roles aceitas: editor, manager, owner, super_admin
3. Viewer não pode criar/editar artigos

---

### Erro 4: "Validation failed (numeric string is expected)" (400)

**Sintomas**:
```json
{
  "statusCode": 400,
  "message": "Validation failed (numeric string is expected)",
  "error": "Bad Request"
}
```

**Causas possíveis**:
1. blogId na URL não é um número
2. Usando slug ao invés de ID

**Exemplo incorreto**:
```
POST /api/cms/blogs/meu-blog/articles  ❌
```

**Exemplo correto**:
```
POST /api/cms/blogs/5/articles  ✅
```

**Solução**:
1. Use o ID numérico do blog, não o slug
2. Liste blogs para obter IDs: `GET /blogs`
3. Confirme que a URL está correta

---

### Erro 5: "title should not be empty" (400)

**Sintomas**:
```json
{
  "statusCode": 400,
  "message": ["title should not be empty"],
  "error": "Bad Request"
}
```

**Causas possíveis**:
1. Campo `title` ausente no body
2. Campo `title` é string vazia
3. Campo `title` contém apenas espaços

**Exemplos incorretos**:
```json
{}  ❌
{ "title": "" }  ❌
{ "title": "   " }  ❌
{ "content": "Conteúdo" }  ❌ (falta title)
```

**Exemplo correto**:
```json
{
  "title": "Meu Artigo",
  "content": "Conteúdo do artigo"
}  ✅
```

**Solução**:
1. Sempre envie o campo `title`
2. Garanta que não está vazio
3. Máximo de 255 caracteres
4. Remova espaços extras

---

### Erro 6: "content should not be empty" (400)

**Sintomas**:
```json
{
  "statusCode": 400,
  "message": ["content should not be empty"],
  "error": "Bad Request"
}
```

**Causas possíveis**:
1. Campo `content` ausente no body
2. Campo `content` é string vazia

**Exemplos incorretos**:
```json
{ "title": "Título" }  ❌ (falta content)
{ "title": "Título", "content": "" }  ❌
{ "title": "Título", "content": null }  ❌
```

**Exemplo correto**:
```json
{
  "title": "Meu Artigo",
  "content": "<p>Conteúdo HTML</p>"
}  ✅
```

**Solução**:
1. Sempre envie o campo `content`
2. Pode ser HTML, Markdown ou texto
3. Não pode ser vazio
4. Sem limite de tamanho

---

### Erro 7: "Blog not found" (404)

**Sintomas**:
```json
{
  "statusCode": 404,
  "message": "Blog not found"
}
```

**Causas possíveis**:
1. Blog não existe
2. Blog foi deletado
3. Blog pertence a outro tenant
4. ID incorreto

**Diagnóstico**:
```bash
# Liste seus blogs
GET /blogs
# Verifique se o blogId existe na resposta
```

**Solução**:
1. Confirme que o blog existe
2. Use o ID correto da lista de blogs
3. Verifique se está usando o tenant correto
4. Se blog foi deletado, crie um novo

---

## Fluxo de Criação Bem-Sucedida

### Passo a Passo Completo

**1. Obter Token JWT**
```bash
POST /api/auth/login
Body: { "email": "admin@exemplo.com", "password": "senha" }
Resposta: { "token": "eyJhbGc..." }
```

**2. Verificar Perfil e Permissões**
```bash
GET /api/auth/me
Headers: { "Authorization": "Bearer {token}" }
Resposta: {
  "id": 10,
  "tenant_id": 5,
  "role": "editor",
  "email": "admin@exemplo.com"
}
```

**3. Listar Blogs Disponíveis**
```bash
GET /blogs
Headers: {
  "Authorization": "Bearer {token}",
  "x-tenant-id": "5"
}
Resposta: [
  { "id": 1, "name": "Blog Principal", "slug": "blog-principal" },
  { "id": 2, "name": "Blog Secundário", "slug": "blog-secundario" }
]
```

**4. Criar Artigo**
```bash
POST /api/cms/blogs/1/articles
Headers: {
  "Authorization": "Bearer {token}",
  "x-tenant-id": "5",
  "Content-Type": "application/json"
}
Body: {
  "title": "Meu Primeiro Artigo",
  "content": "<h1>Introdução</h1><p>Este é o conteúdo...</p>"
}
```

**5. Resposta de Sucesso (201 Created)**
```json
{
  "id": 42,
  "blog_id": 1,
  "title": "Meu Primeiro Artigo",
  "slug": "meu-primeiro-artigo",
  "content": "<h1>Introdução</h1><p>Este é o conteúdo...</p>",
  "status": "draft",
  "display_order": 1,
  "published_at": null,
  "created_at": "2026-02-18T10:30:00.000Z",
  "updated_at": "2026-02-18T10:30:00.000Z"
}
```

---

## Ferramentas de Diagnóstico

### Teste com cURL

```bash
curl -X POST https://api.exemplo.com/api/cms/blogs/1/articles \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "x-tenant-id: 5" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Teste de Artigo",
    "content": "Conteúdo de teste"
  }' \
  -v
```

A flag `-v` mostra detalhes da requisição e resposta, incluindo headers e status codes.

---

### Teste com Postman

**1. Configure a Collection**:
- Crie variável `{{baseUrl}}`: `https://api.exemplo.com`
- Crie variável `{{token}}`: seu token JWT
- Crie variável `{{tenantId}}`: seu tenant ID

**2. Configure a Request**:
- Method: POST
- URL: `{{baseUrl}}/api/cms/blogs/1/articles`
- Headers:
  - `Authorization`: `Bearer {{token}}`
  - `x-tenant-id`: `{{tenantId}}`
  - `Content-Type`: `application/json`
- Body (raw JSON):
```json
{
  "title": "Artigo de Teste",
  "content": "Conteúdo do artigo"
}
```

**3. Verifique a Resposta**:
- Status: 201 Created
- Body contém o artigo criado com ID

---

## Checklist Final de Troubleshooting

Quando a criação falhar, verifique nesta ordem:

### Autenticação
- [ ] Token JWT está presente no header Authorization?
- [ ] Token está no formato `Bearer {token}`?
- [ ] Token não está expirado?
- [ ] Token é válido (não corrompido)?

### Tenant
- [ ] Header `x-tenant-id` está presente?
- [ ] Tenant ID é um número válido?
- [ ] Você pertence a esse tenant?
- [ ] Tenant está ativo?

### Permissões
- [ ] Sua role é `editor` ou superior?
- [ ] Você não é apenas `viewer`?

### URL
- [ ] blogId na URL é um número?
- [ ] Blog existe no sistema?
- [ ] Blog pertence ao seu tenant?
- [ ] URL está correta: `/api/cms/blogs/{id}/articles`?

### Body
- [ ] Campo `title` está presente?
- [ ] `title` não está vazio?
- [ ] `title` tem máximo 255 caracteres?
- [ ] Campo `content` está presente?
- [ ] `content` não está vazio?
- [ ] JSON está bem formatado?

### Headers
- [ ] `Content-Type: application/json` está presente?
- [ ] Não há headers duplicados?
- [ ] Não há espaços extras nos valores?

---

## Resumo Executivo

**Requisitos mínimos para criar artigo**:
1. Token JWT válido de admin com role `editor` ou superior
2. Header `x-tenant-id` com seu tenant ID
3. blogId válido na URL (número, não slug)
4. Body JSON com `title` (1-255 chars) e `content` (não vazio)

**Ordem de validação**:
1. Autenticação JWT → 401 se falhar
2. Tenant válido → 403 se falhar
3. Role suficiente → 403 se falhar
4. blogId numérico → 400 se falhar
5. Body válido → 400 se falhar
6. Blog existe → 404 se falhar
7. Criação bem-sucedida → 201

**Artigo criado com sucesso**:
- Status inicial: `draft`
- Slug gerado automaticamente
- display_order atribuído automaticamente
- published_at é null (não publicado ainda)
- Pronto para adicionar imagens e publicar