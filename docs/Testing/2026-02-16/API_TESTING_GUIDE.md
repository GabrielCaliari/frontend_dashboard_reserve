# Guia de Testes da API

## ✅ Status da API

**API está rodando em:** `http://localhost:3002`  
**Swagger disponível em:** `http://localhost:3002/api/docs`

## 🧪 Testes Realizados

### 1. Verificação do Swagger
✅ **Status:** Funcionando  
✅ **URL:** http://localhost:3002/api/docs  
✅ **Tempo de resposta:** 76ms

### 2. Teste de Login
⚠️ **Status:** Endpoint funcionando, credenciais inválidas  
⚠️ **URL:** POST /auth/admin/authenticate  
⚠️ **Resposta:** `401:ADMIN_EMAIL_NOT_FOUND`

**Isso é esperado!** Você precisa usar credenciais válidas do seu banco de dados.

## 🔑 Como Obter Credenciais Válidas

### Opção 1: Consultar o Banco de Dados
```sql
-- Se estiver usando PostgreSQL/MySQL
SELECT email FROM admins WHERE active = true LIMIT 1;
```

### Opção 2: Criar um Admin de Teste
Consulte a documentação da API backend para criar um admin de teste.

### Opção 3: Usar Swagger
1. Abra http://localhost:3002/api/docs
2. Procure por endpoints de criação de admin
3. Crie um admin de teste via Swagger

## 📝 Testando o Login Manualmente

### Via cURL
```bash
curl -X POST http://localhost:3002/auth/admin/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "SEU_EMAIL_AQUI",
    "password": "SUA_SENHA_AQUI"
  }'
```

### Resposta Esperada (Sucesso)
```json
{
  "session_id": 123,
  "session_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "details": {
    "name": "Nome do Admin",
    "email": "admin@example.com",
    "role": "super_admin"
  }
}
```

### Resposta de Erro
```json
{
  "code": "401:ADMIN_EMAIL_NOT_FOUND"
}
```
ou
```json
{
  "code": "401:ADMIN_PASSWORD_INVALID"
}
```

## 🧪 Testando Requisições Autenticadas

Após obter o `session_token` e `session_id` do login:

### 1. Testar Perfil do Admin
```bash
curl -X GET http://localhost:3002/auth/admin/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "session-id: SEU_SESSION_ID_AQUI"
```

### 2. Testar Lista de Tenants
```bash
curl -X GET http://localhost:3002/auth/tenants/my-tenants \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "session-id: SEU_SESSION_ID_AQUI"
```

### 3. Testar Lista de Campanhas
```bash
curl -X GET http://localhost:3002/mailer/campaigns \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "session-id: SEU_SESSION_ID_AQUI"
```

## 🎯 Testando via Frontend

### 1. Iniciar o Frontend
```bash
cd frontend_dashboard_zarp-admin
npm run dev
```

### 2. Acessar a Página de Login
Abra: http://localhost:3000/auth/login

### 3. Fazer Login
Use as credenciais válidas do seu banco de dados

### 4. Verificar Cookies
1. Abra DevTools (F12)
2. Vá em Application > Cookies > http://localhost:3000
3. Verifique se os seguintes cookies foram criados:
   - `token`
   - `session-code`
   - `session-name`
   - `session-email`
   - `session-role`

### 5. Verificar Headers nas Requisições
1. Vá em Network tab
2. Faça uma ação que chame a API
3. Clique na requisição
4. Verifique os headers:
   - `Authorization: Bearer ...`
   - `session-id: ...`

## 🔍 Explorando a API via Swagger

### 1. Acessar Swagger
Abra: http://localhost:3002/api/docs

### 2. Autenticar no Swagger
1. Clique no botão "Authorize" (cadeado no topo)
2. Cole o token no campo "Bearer"
3. Adicione o session-id se necessário

### 3. Testar Endpoints
Explore os endpoints disponíveis:
- **Auth**: `/auth/*`
- **Mailer**: `/mailer/*`
- **Brands**: `/brands/*`
- **CNPJs**: `/cnpjs/*`
- **Journals**: `/journals/*`

## 📊 Endpoints Principais para Testar

### Autenticação
- ✅ POST `/auth/admin/authenticate` - Login
- ⏳ GET `/auth/admin/me` - Perfil do admin
- ⏳ GET `/auth/tenants/my-tenants` - Lista de tenants

### Campanhas de Email
- ⏳ GET `/mailer/campaigns` - Listar campanhas
- ⏳ POST `/mailer/campaigns` - Criar campanha
- ⏳ GET `/mailer/campaigns/:id` - Detalhes da campanha

### SMTP Servers
- ⏳ GET `/mailer/smtp-servers` - Listar servidores SMTP

### Leads
- ⏳ GET `/auth/leads` - Listar leads
- ⏳ GET `/auth/leads/qualification` - Qualificações

## 🐛 Troubleshooting

### Erro: ECONNREFUSED
**Causa:** API não está rodando  
**Solução:**
```bash
cd backend_api_zarp-admin
npm run dev
```

### Erro: 401 ADMIN_EMAIL_NOT_FOUND
**Causa:** Email não existe no banco de dados  
**Solução:** Use um email válido ou crie um admin de teste

### Erro: 401 ADMIN_PASSWORD_INVALID
**Causa:** Senha incorreta  
**Solução:** Verifique a senha no banco de dados

### Erro: 401 ADMIN_TOKEN_INVALID
**Causa:** Token expirado ou inválido  
**Solução:** Faça login novamente

### Headers não estão sendo enviados
**Causa:** Usando cliente API errado  
**Solução:** Verifique se está usando `api` ao invés de `apiEmail`

## ✅ Checklist de Testes

### Backend
- [x] API rodando em localhost:3002
- [x] Swagger acessível
- [ ] Login funcionando com credenciais válidas
- [ ] Perfil do admin retornando dados
- [ ] Lista de tenants funcionando
- [ ] Lista de campanhas funcionando

### Frontend
- [ ] Frontend rodando em localhost:3000
- [ ] Página de login acessível
- [ ] Login armazenando cookies
- [ ] Headers sendo injetados automaticamente
- [ ] Redirecionamento após login
- [ ] Tratamento de erro 401

### Integração
- [ ] Login via frontend funcionando
- [ ] Requisições autenticadas funcionando
- [ ] Interceptors injetando headers
- [ ] Tratamento de sessão expirada
- [ ] Multi-tenancy funcionando (se aplicável)

## 📝 Próximos Passos

1. **Obter credenciais válidas** do banco de dados
2. **Testar login** via cURL ou Swagger
3. **Testar login** via frontend
4. **Verificar cookies** no navegador
5. **Testar requisições autenticadas**
6. **Migrar próximo serviço** (campanhas de email)

## 🔗 Links Úteis

- **API:** http://localhost:3002
- **Swagger:** http://localhost:3002/api/docs
- **Frontend:** http://localhost:3000
- **Login:** http://localhost:3000/auth/login

---

**Status:** API rodando e pronta para testes  
**Próximo passo:** Obter credenciais válidas e testar login completo
