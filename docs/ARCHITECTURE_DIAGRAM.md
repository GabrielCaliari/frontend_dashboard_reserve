# Diagrama de Arquitetura - Nova Integração

## Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLUXO DE LOGIN                          │
└─────────────────────────────────────────────────────────────────┘

1. Usuário entra com email/senha
   │
   ├─> Hook: useAdminAuthentication()
   │    │
   │    ├─> Action: adminLogin() [Server Action]
   │    │    │
   │    │    ├─> Service: adminLoginService()
   │    │    │    │
   │    │    │    └─> API: POST /auth/admin/authenticate
   │    │    │         │
   │    │    │         └─> Resposta: { session_id, session_token, details }
   │    │    │
   │    │    └─> Retorna para Hook
   │    │
   │    └─> Armazena em Cookies:
   │         - token (session_token)
   │         - session-code (session_id)
   │         - session-name
   │         - session-email
   │         - session-role
   │
   └─> Redireciona para /dashboard
```

## Fluxo de Requisição Autenticada

```
┌─────────────────────────────────────────────────────────────────┐
│                   REQUISIÇÃO AUTENTICADA                        │
└─────────────────────────────────────────────────────────────────┘

1. Componente faz requisição
   │
   ├─> Hook: useCampaigns()
   │    │
   │    ├─> Action: listCampaigns() [Server Action]
   │    │    │
   │    │    ├─> Service: listCampaignsService()
   │    │    │    │
   │    │    │    └─> API Client (axios)
   │    │    │         │
   │    │    │         ├─> Request Interceptor
   │    │    │         │    ├─> Lê cookies
   │    │    │         │    ├─> Injeta Authorization: Bearer <token>
   │    │    │         │    └─> Injeta session-id: <session_id>
   │    │    │         │
   │    │    │         ├─> GET /mailer/campaigns
   │    │    │         │
   │    │    │         └─> Response Interceptor
   │    │    │              ├─> Se 401: Limpa cookies + Redireciona /auth/login
   │    │    │              └─> Se 200: Retorna dados
   │    │    │
   │    │    └─> Retorna para Hook
   │    │
   │    └─> Atualiza estado do componente
   │
   └─> Renderiza UI
```

## Estrutura de Camadas

```
┌─────────────────────────────────────────────────────────────────┐
│                      ARQUITETURA EM CAMADAS                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CAMADA 1: UI (Pages & Components)                              │
│  - src/app/dashboard/                                           │
│  - src/components/                                              │
│  - Responsabilidade: Apresentação e interação com usuário       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CAMADA 2: Hooks                                                │
│  - src/common/hooks/                                            │
│  - Responsabilidade: Lógica de estado e efeitos colaterais      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CAMADA 3: Actions (Server Actions)                             │
│  - src/common/actions/                                          │
│  - Responsabilidade: Ponte entre cliente e servidor             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CAMADA 4: Services                                             │
│  - src/common/services/                                         │
│  - Responsabilidade: Comunicação com API                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CAMADA 5: API Client (Axios)                                   │
│  - src/common/config/api.ts                                     │
│  - Responsabilidade: HTTP client com interceptors               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  CAMADA 6: API Backend (DDD)                                    │
│  - backend_api_zarp-admin                                       │
│  - Responsabilidade: Lógica de negócio e persistência           │
└─────────────────────────────────────────────────────────────────┘
```

## Bounded Contexts da API

```
┌─────────────────────────────────────────────────────────────────┐
│                    BOUNDED CONTEXTS (DDD)                       │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   zarp-auth      │  /auth/*
│                  │  - Admin authentication
│  - Admins        │  - User authentication
│  - Users         │  - Sessions
│  - Sessions      │  - Tenants
│  - Tenants       │  - Leads
│  - Leads         │
└──────────────────┘

┌──────────────────┐
│   zarp-mailer    │  /mailer/*
│                  │  - Email campaigns
│  - Campaigns     │  - Campaign batches
│  - Batches       │  - SMTP servers
│  - SMTP Servers  │  - Deliveries
│  - Deliveries    │
└──────────────────┘

┌──────────────────┐
│   zarp-brands    │  /brands/*
│                  │  - Brand monitoring
│  - Brands        │  - INPI integration
│  - Analytics     │  - Alerts
│  - Monitoring    │
└──────────────────┘

┌──────────────────┐
│   zarp-cnpjs     │  /cnpjs/*
│                  │  - Company data
│  - Companies     │  - CNPJ lookup
│  - States        │  - CNAEs
│  - CNAEs         │
└──────────────────┘

┌──────────────────┐
│  zarp-journals   │  /journals/*
│                  │  - Official journals
│  - Journals      │  - Processing
│  - Processing    │  - Sync
└──────────────────┘

┌──────────────────┐
│   zarp-pi-bot    │  /pi-bot/*
│                  │  - IP Bot
│  - Bot           │  - Conversations
│  - Messages      │
└──────────────────┘

┌──────────────────┐
│    zarp-cms      │  /cms/*
│                  │  - Content management
│  - Content       │  - Posts
│  - Posts         │
└──────────────────┘
```

## Mapeamento de Endpoints

```
┌─────────────────────────────────────────────────────────────────┐
│                    MAPEAMENTO DE ENDPOINTS                      │
└─────────────────────────────────────────────────────────────────┘

ANTES (Monolítico)              DEPOIS (DDD)
─────────────────────────────────────────────────────────────────

/admin/authenticate       →     /auth/admin/authenticate
/admin/me                 →     /auth/admin/me

/email-campaign           →     /mailer/campaigns
/email-campaign/:id       →     /mailer/campaigns/:id
/campaign-batch/:id       →     /mailer/batches/:id
/smtp-servers             →     /mailer/smtp-servers

/leads                    →     /auth/leads
/leads/:id                →     /auth/leads/:id

/brand-analytics          →     /brands/analytics
/brand-analytics/:id      →     /brands/analytics/:id

/companies                →     /cnpjs/companies
/states                   →     /cnpjs/states

/journals                 →     /journals/*
```

## Sistema de Autenticação

```
┌─────────────────────────────────────────────────────────────────┐
│                  SISTEMA DE AUTENTICAÇÃO                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  COOKIES (Client-side)                                          │
├─────────────────────────────────────────────────────────────────┤
│  token           → JWT session_token                            │
│  session-code    → Numeric session ID                           │
│  session-name    → Admin name                                   │
│  session-email   → Admin email                                  │
│  session-role    → Admin role (super_admin, company_admin, etc) │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  AXIOS INTERCEPTOR (Request)                                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Lê cookies                                                  │
│  2. Injeta headers:                                             │
│     - Authorization: Bearer <token>                             │
│     - session-id: <session-code>                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  API BACKEND                                                    │
├─────────────────────────────────────────────────────────────────┤
│  1. Valida JWT token                                            │
│  2. Valida session_id                                           │
│  3. Verifica se sessão está ativa                               │
│  4. Verifica permissões (role)                                  │
│  5. Retorna dados ou erro                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  AXIOS INTERCEPTOR (Response)                                   │
├─────────────────────────────────────────────────────────────────┤
│  Se 401 (Unauthorized):                                         │
│    - Limpa todos os cookies                                     │
│    - Redireciona para /auth/login                               │
│                                                                 │
│  Se 403 (Forbidden):                                            │
│    - Mostra mensagem de permissão negada                        │
│                                                                 │
│  Se 200 (OK):                                                   │
│    - Retorna dados para o serviço                               │
└─────────────────────────────────────────────────────────────────┘
```

## Sistema de Permissões

```
┌─────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE PERMISSÕES                        │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│   super_admin    │  ✓ Acesso total ao sistema
│                  │  ✓ Gerenciar admins
│  Permissões:     │  ✓ Gerenciar tenants
│  - Tudo          │  ✓ Ver relatórios
│                  │  ✓ Gerenciar campanhas
└──────────────────┘

┌──────────────────┐
│  company_admin   │  ✗ Gerenciar admins
│                  │  ✗ Gerenciar tenants
│  Permissões:     │  ✓ Ver relatórios
│  - Empresa       │  ✓ Gerenciar campanhas
│                  │  ✓ Ver múltiplos tenants
└──────────────────┘

┌──────────────────┐
│   tenant_admin   │  ✗ Gerenciar admins
│                  │  ✗ Gerenciar tenants
│  Permissões:     │  ✗ Ver relatórios globais
│  - Tenant        │  ✓ Gerenciar campanhas do tenant
│                  │  ✓ Ver apenas seu tenant
└──────────────────┘
```

## Multi-tenancy

```
┌─────────────────────────────────────────────────────────────────┐
│                        MULTI-TENANCY                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Admin (company_admin)                                          │
├─────────────────────────────────────────────────────────────────┤
│  name: "João Silva"                                             │
│  email: "joao@zarp.com.br"                                      │
│  role: company_admin                                            │
│                                                                 │
│  tenants: [                                                     │
│    { id: 1, name: "Empresa X", slug: "empresa-x" },            │
│    { id: 2, name: "Empresa Y", slug: "empresa-y" },            │
│    { id: 3, name: "Empresa Z", slug: "empresa-z" }             │
│  ]                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  UI: Tenant Selector                                            │
├─────────────────────────────────────────────────────────────────┤
│  [ Empresa X ▼ ]                                                │
│    - Empresa X                                                  │
│    - Empresa Y                                                  │
│    - Empresa Z                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Contexto da Aplicação                                          │
├─────────────────────────────────────────────────────────────────┤
│  selectedTenant: { id: 1, name: "Empresa X" }                   │
│                                                                 │
│  Todas as requisições podem incluir:                            │
│  - tenant-id: 1 (header opcional)                               │
└─────────────────────────────────────────────────────────────────┘
```

## Fluxo de Erro

```
┌─────────────────────────────────────────────────────────────────┐
│                      TRATAMENTO DE ERROS                        │
└─────────────────────────────────────────────────────────────────┘

API retorna erro
   │
   ├─> 401 (Unauthorized)
   │    ├─> Token inválido ou expirado
   │    ├─> Session ID inválido
   │    └─> Ação: Limpar cookies + Redirecionar /auth/login
   │
   ├─> 403 (Forbidden)
   │    ├─> Conta desativada
   │    ├─> Permissões insuficientes
   │    └─> Ação: Mostrar mensagem de erro
   │
   ├─> 404 (Not Found)
   │    ├─> Recurso não encontrado
   │    └─> Ação: Mostrar mensagem de erro
   │
   └─> 500 (Internal Server Error)
        ├─> Erro no servidor
        └─> Ação: Mostrar mensagem genérica
```

---

## Legenda

```
┌─────────────────────────────────────────────────────────────────┐
│  SÍMBOLOS                                                       │
├─────────────────────────────────────────────────────────────────┤
│  →   Transformação/Migração                                     │
│  ├─> Fluxo de execução                                          │
│  └─> Resultado final                                            │
│  ▼   Próximo passo                                              │
│  ✓   Permitido                                                  │
│  ✗   Não permitido                                              │
└─────────────────────────────────────────────────────────────────┘
```
