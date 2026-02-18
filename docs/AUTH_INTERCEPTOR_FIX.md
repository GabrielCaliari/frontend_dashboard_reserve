# Fix: Redirecionamento Indevido para /auth/login

## Problema

Ao tentar criar um novo artigo de blog, o usuário estava sendo redirecionado automaticamente para `/auth/login` sem motivo aparente. Isso acontecia porque múltiplos interceptores axios estavam capturando erros 401 e redirecionando de forma prematura.

## Causa Raiz

O projeto tinha **3 clientes axios diferentes** com interceptores de resposta duplicados:

1. `api.ts` - Cliente principal
2. `cms-api-client.ts` - Cliente CMS autenticado
3. `api-email.ts` - Cliente de email

Todos os três tinham o mesmo código de interceptor que:
- Capturava qualquer erro 401
- Limpava cookies de autenticação
- Redirecionava para `/auth/login`

Isso causava problemas quando:
- Um erro 401 era recuperável (ex: problema de tenant, não de autenticação)
- Múltiplos interceptores tentavam redirecionar ao mesmo tempo
- Erros de API específicos precisavam de tratamento customizado

## Solução Implementada

### 1. Criado Utilitário Centralizado

Arquivo: `src/common/utils/auth-error-handler.ts`

```typescript
// Funções utilitárias para lidar com erros 401
- isUnauthorizedError() - Verifica se é erro 401
- handleUnauthorizedError() - Limpa auth e redireciona
- handleApiError() - Handler opcional para catch blocks
```

### 2. Atualizado Interceptores

#### `api.ts` (Cliente Principal)
- **ÚNICO** responsável por redirecionamento automático em 401
- Usa o utilitário centralizado
- Mantém comportamento global de segurança

#### `cms-api-client.ts` (Cliente CMS)
- **Removido** redirecionamento automático
- Erros 401 propagam para o serviço
- Permite tratamento granular de erros

#### `api-email.ts` (Cliente Email)
- **Removido** redirecionamento automático
- Erros 401 propagam para o serviço
- Permite tratamento granular de erros

#### `cms-public-api-client.ts` (Cliente CMS Público)
- Adicionado interceptor que **não** redireciona
- Usa autenticação por secret key, não JWT
- Erros 401 são tratados pelo serviço

### 3. Arquitetura de Tratamento de Erros

```
┌─────────────────────────────────────────────────────────────┐
│                     API Call Flow                            │
└─────────────────────────────────────────────────────────────┘

Component/Page
    ↓
Service Layer (cms-article-service.ts)
    ↓
API Client (cms-api-client.ts)
    ↓ [401 Error]
    ↓ [Propagates to Service]
    ↓
Service catches and transforms error (transformCMSError)
    ↓
Component handles error (toast, error message)

ONLY if using api.ts directly:
    ↓ [401 Error]
    ↓ [Auto-redirect to /auth/login]
```

## Benefícios

1. **Sem Redirecionamentos Prematuros**: Erros 401 são tratados de forma contextual
2. **Melhor UX**: Mensagens de erro específicas antes de redirecionar
3. **Código Mais Limpo**: Um único ponto de responsabilidade para auth redirect
4. **Mais Flexível**: Serviços podem decidir como tratar 401s
5. **Sem Loops**: Elimina possibilidade de múltiplos redirects simultâneos

## Quando Usar Cada Cliente

| Cliente | Uso | Redirecionamento 401 |
|---------|-----|---------------------|
| `api.ts` | Endpoints gerais da API | ✅ Automático |
| `cms-api-client.ts` | Endpoints CMS autenticados | ❌ Manual (via serviço) |
| `api-email.ts` | Endpoints de email | ❌ Manual (via serviço) |
| `cms-public-api-client.ts` | Endpoints CMS públicos | ❌ Nunca (usa secret key) |

## Tratamento Manual de 401 (Opcional)

Se um serviço específico precisar redirecionar em 401:

```typescript
import { handleApiError } from '@/src/common/utils/auth-error-handler';

try {
  await cmsApiClient.post('/endpoint', data);
} catch (error) {
  handleApiError(error, true); // true = redirect on 401
  throw error;
}
```

## Testes Necessários

- [ ] Criar artigo com token válido
- [ ] Criar artigo com token expirado (deve mostrar erro, não redirecionar imediatamente)
- [ ] Criar artigo sem tenant selecionado (deve mostrar erro específico)
- [ ] Login com credenciais inválidas (deve mostrar erro, não loop)
- [ ] Acessar endpoint protegido sem token (deve redirecionar via api.ts)

## Arquivos Modificados

1. `src/common/config/api.ts` - Mantém redirect automático
2. `src/common/config/cms-api-client.ts` - Remove redirect automático
3. `src/common/config/api-email.ts` - Remove redirect automático
4. `src/common/config/cms-public-api-client.ts` - Adiciona interceptor sem redirect
5. `src/common/utils/auth-error-handler.ts` - Novo utilitário centralizado

## Próximos Passos

1. Testar fluxo completo de criação de artigo
2. Verificar se outros fluxos não foram afetados
3. Considerar adicionar logging de erros 401 para debug
4. Documentar padrão de tratamento de erros para novos desenvolvedores
