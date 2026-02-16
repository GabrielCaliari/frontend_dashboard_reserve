# Exemplo de Migração de Serviço

Este documento mostra um exemplo prático de como migrar um serviço existente para a nova arquitetura DDD.

## Exemplo: List Email Campaign Service

### Antes (Código Original)

```typescript
// src/common/services/email-campaign/list-email-campaign-service.ts
import apiEmail from "../../config/api-email";
import { errorTypes } from "../../config/error-types";

export default async function listEmailCampaignService() {
    try {
        const response = await apiEmail.get("/email-campaign");
        return response.data;
    } catch (err: any) {
        if (err.response && err.response.data.code) {
            let message = '';

            switch (err.response.data.code) {
                case errorTypes._500.get_all_email_campaign:
                default:
                    message = 'Houve um erro ao listar as campanhas de e-mail.';
                    break;
            }

            return {
                error: true,
                message: message,
            };
        }

        return {
            error: true,
            message: 'Erro ao listar as campanhas de e-mail.',
        };
    }
}
```

### Depois (Código Migrado)

```typescript
// src/common/services/email-campaign/list-email-campaign-service.ts
import api from "../../config/api"; // MUDANÇA: usar api principal ao invés de apiEmail
import { errorTypes } from "../../config/error-types";

export default async function listEmailCampaignService() {
    try {
        // MUDANÇA: endpoint de /email-campaign para /mailer/campaigns
        const response = await api.get("/mailer/campaigns");
        return response.data;
    } catch (err: any) {
        if (err.response && err.response.data.code) {
            let message = '';

            switch (err.response.data.code) {
                case errorTypes._500.get_all_email_campaign:
                default:
                    message = 'Houve um erro ao listar as campanhas de e-mail.';
                    break;
            }

            return {
                error: true,
                message: message,
            };
        }

        return {
            error: true,
            message: 'Erro ao listar as campanhas de e-mail.',
        };
    }
}
```

### Mudanças Realizadas

1. **Import do cliente API**: Mudou de `apiEmail` para `api`
   - Motivo: A nova arquitetura usa um único cliente API principal
   - O cliente `api` já tem os interceptors configurados para autenticação

2. **Endpoint**: Mudou de `/email-campaign` para `/mailer/campaigns`
   - Motivo: Nova arquitetura DDD com contextos delimitados
   - Campanhas de email agora estão no contexto `mailer`

3. **Headers de autenticação**: Não é necessário adicionar manualmente
   - Os interceptors em `api.ts` já injetam automaticamente:
     - `Authorization: Bearer <token>`
     - `session-id: <session_id>`

## Exemplo: Create Email Campaign Service

### Antes

```typescript
// src/common/services/email-campaign/create-email-campaign-service.ts
import apiEmail from "../../config/api-email";

export async function createEmailCampaignService(data: any) {
    try {
        const response = await apiEmail.post("/email-campaign", data);
        return response.data;
    } catch (error: any) {
        if (error?.response?.data?.code) {
            return error.response.data.code;
        }
        return '500:CREATE_EMAIL_CAMPAIGN';
    }
}
```

### Depois

```typescript
// src/common/services/email-campaign/create-email-campaign-service.ts
import api from "../../config/api"; // MUDANÇA: usar api principal

export async function createEmailCampaignService(data: any) {
    try {
        // MUDANÇA: endpoint de /email-campaign para /mailer/campaigns
        const response = await api.post("/mailer/campaigns", data);
        return response.data;
    } catch (error: any) {
        if (error?.response?.data?.code) {
            return error.response.data.code;
        }
        return '500:CREATE_EMAIL_CAMPAIGN';
    }
}
```

## Exemplo: Get Campaign By ID

### Antes

```typescript
import apiEmail from "../../config/api-email";

export async function getCampaignByIdService(id: string) {
    try {
        const response = await apiEmail.get(`/email-campaign/${id}`);
        return response.data;
    } catch (error: any) {
        return error.response?.data?.code || '500:ERROR';
    }
}
```

### Depois

```typescript
import api from "../../config/api"; // MUDANÇA: usar api principal

export async function getCampaignByIdService(id: string) {
    try {
        // MUDANÇA: endpoint de /email-campaign/:id para /mailer/campaigns/:id
        const response = await api.get(`/mailer/campaigns/${id}`);
        return response.data;
    } catch (error: any) {
        return error.response?.data?.code || '500:ERROR';
    }
}
```

## Mapeamento Completo de Endpoints

### Email Campaigns (Contexto: mailer)

| Método | Endpoint Antigo | Endpoint Novo |
|--------|----------------|---------------|
| GET | `/email-campaign` | `/mailer/campaigns` |
| POST | `/email-campaign` | `/mailer/campaigns` |
| GET | `/email-campaign/:id` | `/mailer/campaigns/:id` |
| PUT | `/email-campaign/:id` | `/mailer/campaigns/:id` |
| DELETE | `/email-campaign/:id` | `/mailer/campaigns/:id` |
| POST | `/email-campaign/:id/start` | `/mailer/campaigns/:id/start` |
| POST | `/email-campaign/:id/leads` | `/mailer/campaigns/:id/leads` |
| GET | `/email-campaign/:id/batches` | `/mailer/campaigns/:id/batches` |
| PUT | `/email-campaign/:id/batch-size` | `/mailer/campaigns/:id/batch-size` |
| GET | `/email-campaign/:id/primary-copy` | `/mailer/campaigns/:id/primary-copy` |
| POST | `/email-campaign/:id/primary-copy` | `/mailer/campaigns/:id/primary-copy` |
| PUT | `/email-campaign/:id/copy-variant` | `/mailer/campaigns/:id/copy-variant` |
| PUT | `/email-campaign/:id/metrics` | `/mailer/campaigns/:id/metrics` |
| POST | `/email-campaign/:id/close-setup` | `/mailer/campaigns/:id/close-setup` |

### Campaign Batches (Contexto: mailer)

| Método | Endpoint Antigo | Endpoint Novo |
|--------|----------------|---------------|
| GET | `/campaign-batch/:id/deliveries` | `/mailer/batches/:id/deliveries` |
| GET | `/campaign-batch/:id/emails` | `/mailer/batches/:id/emails` |
| PUT | `/campaign-batch/:id/email` | `/mailer/batches/:id/email` |
| PUT | `/campaign-batch/:id/copy` | `/mailer/batches/:id/copy` |

### SMTP Servers (Contexto: mailer)

| Método | Endpoint Antigo | Endpoint Novo |
|--------|----------------|---------------|
| GET | `/smtp-servers` | `/mailer/smtp-servers` |
| POST | `/smtp-servers` | `/mailer/smtp-servers` |
| GET | `/smtp-servers/:id` | `/mailer/smtp-servers/:id` |
| PUT | `/smtp-servers/:id` | `/mailer/smtp-servers/:id` |
| DELETE | `/smtp-servers/:id` | `/mailer/smtp-servers/:id` |

### Leads (Contexto: auth)

| Método | Endpoint Antigo | Endpoint Novo |
|--------|----------------|---------------|
| GET | `/leads` | `/auth/leads` |
| GET | `/leads/qualification` | `/auth/leads/qualification` |
| PUT | `/leads/:id/qualification` | `/auth/leads/:id/qualification` |
| POST | `/leads/:id/complete-screening` | `/auth/leads/:id/complete-screening` |
| GET | `/leads/temperature-analysis/:messageId` | `/auth/leads/temperature-analysis/:messageId` |

## Checklist de Migração por Serviço

Para cada serviço que você migrar, siga este checklist:

- [ ] Trocar import de `apiEmail` para `api`
- [ ] Atualizar endpoint conforme tabela de mapeamento
- [ ] Remover código de injeção manual de headers (se houver)
- [ ] Testar o serviço com a API rodando
- [ ] Atualizar a action correspondente (se necessário)
- [ ] Atualizar o hook correspondente (se necessário)
- [ ] Testar o fluxo completo na UI

## Testando a Migração

### 1. Com a API rodando

```bash
# Terminal 1: Iniciar a API
cd backend_api_zarp-admin
npm run dev

# Terminal 2: Iniciar o frontend
cd frontend_dashboard_zarp-admin
npm run dev
```

### 2. Testar no navegador

1. Fazer login em `http://localhost:3000/auth/login`
2. Verificar se cookies foram armazenados (DevTools > Application > Cookies)
3. Navegar para página que usa o serviço migrado
4. Verificar requisições no Network tab
5. Confirmar que headers `Authorization` e `session-id` estão presentes

### 3. Verificar erros

Se houver erro 401:
- Verificar se cookies estão sendo armazenados
- Verificar se interceptor está funcionando
- Verificar se API está rodando

Se houver erro 404:
- Verificar se endpoint foi atualizado corretamente
- Consultar Swagger em `http://localhost:3002/api/docs`

## Próximos Passos

1. Migrar todos os serviços de email-campaign
2. Migrar serviços de campaign-batch
3. Migrar serviços de smtp-server
4. Migrar serviços de leads
5. Atualizar actions correspondentes
6. Atualizar hooks correspondentes
7. Testar fluxo completo
