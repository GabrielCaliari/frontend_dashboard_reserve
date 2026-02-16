# Guia de Testes - Migração API DDD

## Pré-requisitos

1. API rodando em `http://localhost:3002`
2. Swagger disponível em `http://localhost:3002/api/docs`
3. Frontend rodando em `http://localhost:3000`

## Comandos para Iniciar

```bash
# Terminal 1: Backend API
cd ../backend_api_zarp-admin
npm run dev

# Terminal 2: Frontend
npm run dev
```

## Testes de Autenticação

### 1. Login Bem-Sucedido

**Objetivo:** Verificar que o login funciona e não há redirect loop

**Passos:**
1. Abrir `http://localhost:3000/auth/login`
2. Inserir credenciais válidas
3. Clicar em "Login"

**Resultado Esperado:**
- ✅ Redirect para `/dashboard` (sem loop)
- ✅ 5 cookies definidos no DevTools:
  - `token` (httpOnly: true)
  - `session-code` (httpOnly: false)
  - `session-name` (httpOnly: false)
  - `session-email` (httpOnly: false)
  - `session-role` (httpOnly: false)

**Como Verificar Cookies:**
1. Abrir DevTools (F12)
2. Application > Cookies > http://localhost:3000
3. Verificar que todos os 5 cookies existem

### 2. Login com Credenciais Inválidas

**Objetivo:** Verificar tratamento de erro

**Passos:**
1. Abrir `http://localhost:3000/auth/login`
2. Inserir email ou senha incorretos
3. Clicar em "Login"

**Resultado Esperado:**
- ✅ Toast de erro: "Não foi possível autenticar."
- ✅ Permanece na página de login
- ✅ Nenhum cookie definido

### 3. Acesso a Rota Protegida Sem Login

**Objetivo:** Verificar proteção de rotas

**Passos:**
1. Limpar todos os cookies (DevTools > Application > Clear storage)
2. Tentar acessar `http://localhost:3000/dashboard`

**Resultado Esperado:**
- ✅ Redirect automático para `/auth/login`

### 4. Acesso à Raiz com Login

**Objetivo:** Verificar redirect da raiz

**Passos:**
1. Fazer login
2. Acessar `http://localhost:3000/`

**Resultado Esperado:**
- ✅ Redirect automático para `/dashboard`

### 5. Acesso ao Login com Sessão Ativa

**Objetivo:** Verificar que usuário logado não vê tela de login

**Passos:**
1. Fazer login
2. Tentar acessar `http://localhost:3000/auth/login`

**Resultado Esperado:**
- ✅ Redirect automático para `/dashboard`

## Testes de API Requests

### 6. Headers Automáticos

**Objetivo:** Verificar que o interceptor injeta headers automaticamente

**Passos:**
1. Fazer login
2. Navegar para qualquer página do dashboard
3. Abrir DevTools > Network
4. Fazer qualquer ação que chame a API (ex: listar campanhas)
5. Clicar na requisição no Network tab
6. Ver "Headers" > "Request Headers"

**Resultado Esperado:**
- ✅ Header `Authorization: Bearer <token>`
- ✅ Header `session-id: <session_id>`
- ✅ Headers injetados automaticamente (não passados manualmente)

### 7. Listar Leads

**Objetivo:** Verificar funcionalidade de listagem de leads

**Passos:**
1. Fazer login
2. Navegar para página de leads
3. Verificar que leads são carregados

**Resultado Esperado:**
- ✅ Lista de leads exibida
- ✅ Paginação funciona
- ✅ Requisição para `/auth/leads?page=1` com headers corretos

### 8. Qualificar Lead

**Objetivo:** Verificar atualização de qualificação

**Passos:**
1. Fazer login
2. Navegar para triagem de leads
3. Selecionar um lead
4. Atualizar o card de qualificação

**Resultado Esperado:**
- ✅ Qualificação atualizada
- ✅ Requisição PUT para `/auth/leads/:id/qualification` com headers corretos
- ✅ Toast de sucesso (se implementado)

### 9. Completar Screening

**Objetivo:** Verificar conclusão de triagem

**Passos:**
1. Fazer login
2. Navegar para triagem de leads
3. Selecionar um lead
4. Marcar screening como completo

**Resultado Esperado:**
- ✅ Screening marcado como completo
- ✅ Requisição POST para `/auth/leads/:id/complete-screening` com headers corretos
- ✅ Toast: "O processo de triagem do Lead foi fechado com sucesso."

### 10. Análise de Temperatura

**Objetivo:** Verificar análise de temperatura

**Passos:**
1. Fazer login
2. Navegar para triagem de leads
3. Selecionar um lead
4. Solicitar análise de temperatura

**Resultado Esperado:**
- ✅ Análise processada
- ✅ Requisição POST para `/auth/leads/temperature-analysis/:id` com headers corretos
- ✅ Toast: "Temperatura processada com sucesso."

## Testes de Expiração e Segurança

### 11. Token Expirado

**Objetivo:** Verificar comportamento com token expirado

**Passos:**
1. Fazer login
2. No DevTools, deletar o cookie `token`
3. Tentar fazer qualquer ação que chame a API

**Resultado Esperado:**
- ✅ API retorna 401
- ✅ Interceptor limpa todos os cookies
- ✅ Redirect automático para `/auth/login`

### 12. Cookie httpOnly

**Objetivo:** Verificar segurança do token

**Passos:**
1. Fazer login
2. Abrir DevTools > Console
3. Tentar acessar: `document.cookie`

**Resultado Esperado:**
- ✅ Cookie `token` NÃO aparece (httpOnly: true)
- ✅ Outros cookies aparecem (session-code, session-name, etc.)

## Testes de Campanhas de Email

### 13. Listar Campanhas

**Objetivo:** Verificar listagem de campanhas

**Passos:**
1. Fazer login
2. Navegar para página de campanhas
3. Verificar lista de campanhas

**Resultado Esperado:**
- ✅ Campanhas listadas
- ✅ Requisição para `/mailer/campaigns` com headers corretos

### 14. Criar Campanha

**Objetivo:** Verificar criação de campanha

**Passos:**
1. Fazer login
2. Clicar em "Nova Campanha"
3. Preencher formulário
4. Submeter

**Resultado Esperado:**
- ✅ Campanha criada
- ✅ Requisição POST para `/mailer/campaigns` com headers corretos
- ✅ Redirect ou atualização da lista

### 15. Upload de Leads para Campanha

**Objetivo:** Verificar upload de leads

**Passos:**
1. Fazer login
2. Abrir uma campanha
3. Fazer upload de arquivo CSV com leads

**Resultado Esperado:**
- ✅ Leads importados
- ✅ Requisição POST para `/mailer/campaigns/:id/leads` com headers corretos
- ✅ Feedback de sucesso

## Checklist Rápido

Use este checklist para verificação rápida:

- [ ] Login funciona sem redirect loop
- [ ] 5 cookies são definidos após login
- [ ] Cookie `token` é httpOnly
- [ ] Rotas protegidas redirecionam para login sem autenticação
- [ ] Usuário logado é redirecionado de `/` para `/dashboard`
- [ ] Usuário logado é redirecionado de `/auth/login` para `/dashboard`
- [ ] Headers `Authorization` e `session-id` são injetados automaticamente
- [ ] Listar leads funciona
- [ ] Qualificar lead funciona
- [ ] Completar screening funciona
- [ ] Análise de temperatura funciona
- [ ] Token expirado causa redirect para login
- [ ] Listar campanhas funciona
- [ ] Criar campanha funciona
- [ ] Upload de leads funciona

## Troubleshooting

### Problema: Redirect Loop no Login

**Sintoma:** Após login, fica redirecionando entre `/auth/login` e `/dashboard`

**Possíveis Causas:**
1. Cookies não estão sendo definidos
2. Proxy não está lendo cookies corretamente
3. Token cookie não está presente

**Solução:**
1. Verificar DevTools > Application > Cookies
2. Verificar que `token` cookie existe
3. Verificar console do servidor para erros
4. Limpar todos os cookies e tentar novamente

### Problema: 401 Unauthorized

**Sintoma:** Requisições API retornam 401

**Possíveis Causas:**
1. Headers não estão sendo injetados
2. Token inválido ou expirado
3. API não está aceitando o token

**Solução:**
1. Verificar DevTools > Network > Request Headers
2. Confirmar que `Authorization` e `session-id` estão presentes
3. Verificar formato: `Authorization: Bearer <token>`
4. Verificar logs da API para detalhes do erro

### Problema: Cookies Não Aparecem

**Sintoma:** Após login, cookies não são definidos

**Possíveis Causas:**
1. Erro no adminLogin action
2. API não retornou dados corretos
3. Erro de CORS ou SameSite

**Solução:**
1. Verificar console do navegador para erros
2. Verificar Network tab para resposta da API
3. Verificar que API retorna `session_token` e `session_id`
4. Verificar configuração de cookies (sameSite, secure)

### Problema: Headers Não São Injetados

**Sintoma:** Requisições não têm headers de autenticação

**Possíveis Causas:**
1. Interceptor não está funcionando
2. Cookies não estão acessíveis no browser context
3. Requisição não está usando o cliente `api` correto

**Solução:**
1. Verificar que service usa `import api from '../config/api'`
2. Verificar que cookies existem no DevTools
3. Verificar que interceptor está configurado em `src/common/config/api.ts`
4. Verificar console para erros do interceptor

## Logs Úteis

### Backend API
```bash
# Ver logs da API
cd ../backend_api_zarp-admin
npm run dev

# Procurar por:
# - POST /auth/admin/authenticate
# - GET /auth/leads
# - GET /mailer/campaigns
# - Erros 401
```

### Frontend
```bash
# Ver logs do Next.js
npm run dev

# Procurar por:
# - Erros de compilação
# - Avisos de cookies
# - Erros de requisição
```

### Browser Console
```javascript
// Ver cookies
document.cookie

// Ver localStorage
localStorage

// Ver sessionStorage
sessionStorage
```

## Conclusão

Após completar todos os testes acima, você terá verificado:

1. ✅ Autenticação funciona corretamente
2. ✅ Proteção de rotas funciona
3. ✅ Headers são injetados automaticamente
4. ✅ Todas as funcionalidades de leads funcionam
5. ✅ Campanhas de email funcionam
6. ✅ Segurança está adequada (httpOnly, secure)
7. ✅ Tratamento de erros funciona

Se todos os testes passarem, a migração está completa e o sistema está pronto para produção!

---

**Última Atualização:** 16 de Fevereiro de 2026  
**Versão:** 1.0
