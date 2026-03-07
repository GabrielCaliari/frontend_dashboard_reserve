# Documentação de Migração - ZARP Admin Dashboard

## 🎯 Início Rápido

**Novo aqui?** Comece com o [Guia de Início Rápido](GETTING_STARTED.md) (5 minutos)

**Procurando algo específico?** Use o [Índice Completo](INDEX.md)

---

## 📚 Índice de Documentos

### 0. Guia de Início Rápido ⭐
**Arquivo:** `GETTING_STARTED.md`

Guia prático para começar rapidamente:
- Setup do ambiente (5 minutos)
- Checklist de verificação
- O que mudou (resumo visual)
- Conceitos principais
- Ferramentas disponíveis
- Exemplo prático completo
- Próximos passos
- Problemas comuns e soluções

**Quando usar:** Primeira coisa a ler quando começar a trabalhar com a nova arquitetura.

---

### 1. Manual Completo
**Arquivo:** `manual-atualizacao-client-nextjs.md`

Documentação completa e detalhada da nova arquitetura DDD da API, incluindo:
- Visão geral das mudanças
- Configuração de ambiente
- Autenticação de administradores
- Requisições autenticadas
- Gestão de tenants
- Roles e permissões
- Tratamento de erros
- Exemplos completos de integração

**Quando usar:** Para entender a fundo todas as mudanças e conceitos da nova arquitetura.

---

### 2. Diagrama de Arquitetura
**Arquivo:** `ARCHITECTURE_DIAGRAM.md`

Diagramas visuais da arquitetura:
- Fluxo de autenticação
- Fluxo de requisição autenticada
- Estrutura de camadas
- Bounded Contexts da API
- Mapeamento de endpoints
- Sistema de autenticação
- Sistema de permissões
- Multi-tenancy
- Tratamento de erros

**Quando usar:** Para visualizar rapidamente como o sistema funciona e como os componentes se conectam.

---

### 3. Resumo da Migração
**Arquivo:** `MIGRATION_SUMMARY.md`

Resumo executivo das mudanças implementadas:
- Arquivos criados
- Arquivos modificados
- Mudanças principais
- Como usar os novos recursos
- Próximos passos

**Quando usar:** Para ter uma visão geral rápida do que foi feito e o que falta fazer.

---

### 4. Checklist de Migração
**Arquivo:** `MIGRATION_CHECKLIST.md`

Lista completa de tarefas organizadas por fase:
- ✅ Fase 1: Autenticação (Concluída)
- 🔄 Fase 2: Campanhas de Email (Pendente)
- 🔄 Fase 3: SMTP Servers (Pendente)
- 🔄 Fase 4: Leads (Pendente)
- 🔄 Fase 5: Brand Analytics (Pendente)
- 🔄 Fase 6: States (Pendente)
- 🔄 Fase 7: Actions (Pendente)
- 🔄 Fase 8: Hooks (Pendente)
- 🔄 Fase 9: Componentes e Páginas (Pendente)
- 🔄 Fase 10: Testes (Pendente)

**Quando usar:** Para acompanhar o progresso da migração e saber o que fazer a seguir.

---

### 5. Exemplo de Migração
**Arquivo:** `MIGRATION_EXAMPLE.md`

Exemplos práticos de código antes e depois da migração:
- Migração de serviços
- Mapeamento completo de endpoints
- Checklist por serviço
- Como testar

**Quando usar:** Quando for migrar um serviço específico e precisar de um exemplo prático.

---

### 6. Referência Rápida
**Arquivo:** `QUICK_REFERENCE.md`

Guia de consulta rápida com:
- Mudanças principais
- Novos recursos
- Cookies armazenados
- Roles de admin
- Códigos de erro
- Exemplo completo
- Troubleshooting

**Quando usar:** Durante o desenvolvimento, para consultas rápidas de sintaxe e padrões.

---

### 7. Comandos de Desenvolvimento
**Arquivo:** `DEV_COMMANDS.md`

Comandos úteis para o dia a dia:
- Iniciar servidores
- Verificar estrutura
- Buscar código
- Testes
- Git
- Debug
- Migração em massa
- Limpeza

**Quando usar:** Para executar tarefas comuns de desenvolvimento rapidamente.

---

## 🚀 Por Onde Começar?

### 🆕 Novo no Projeto? Comece Aqui!
**Leia primeiro:** `GETTING_STARTED.md` - Guia de início rápido (5 minutos)

### Se você é novo no projeto:
1. Siga o **Guia de Início Rápido** (`GETTING_STARTED.md`)
2. Veja o **Diagrama de Arquitetura** (`ARCHITECTURE_DIAGRAM.md`) para entender visualmente
3. Leia o **Manual Completo** (`manual-atualizacao-client-nextjs.md`)
4. Revise o **Resumo da Migração** (`MIGRATION_SUMMARY.md`)
5. Use a **Referência Rápida** (`QUICK_REFERENCE.md`) durante o desenvolvimento

### Se você vai migrar código:
1. Consulte o **Checklist** (`MIGRATION_CHECKLIST.md`) para ver o que falta
2. Use o **Exemplo de Migração** (`MIGRATION_EXAMPLE.md`) como guia
3. Mantenha a **Referência Rápida** (`QUICK_REFERENCE.md`) aberta
4. Use os **Comandos de Desenvolvimento** (`DEV_COMMANDS.md`) para tarefas comuns

### Se você está debugando:
1. Consulte a seção **Troubleshooting** na **Referência Rápida**
2. Veja o **Diagrama de Arquitetura** para entender o fluxo
3. Verifique o **Manual Completo** para detalhes de implementação
4. Consulte o Swagger da API: `http://localhost:3002/api/docs`

---

## 📁 Estrutura de Arquivos Criados/Modificados

### Novos Arquivos

```
src/common/
├── @types/
│   └── @auth.ts                          # Tipos de autenticação
├── services/
│   ├── admin-profile.ts                  # Serviço de perfil
│   └── tenant.ts                         # Serviço de tenants
├── actions/
│   ├── admin-profile.tsx                 # Action de perfil
│   └── tenant.tsx                        # Action de tenants
├── hooks/
│   ├── use-admin-profile.ts              # Hook de perfil
│   ├── use-tenants.ts                    # Hook de tenants
│   └── use-permissions.ts                # Hook de permissões
└── utils/
    └── auth.ts                           # Utilitários de auth

src/components/
└── tenant-selector.tsx                   # Componente de seletor

docs/
├── README.md                             # Este arquivo
├── MIGRATION_SUMMARY.md                  # Resumo da migração
├── MIGRATION_CHECKLIST.md                # Checklist de tarefas
├── MIGRATION_EXAMPLE.md                  # Exemplos práticos
└── QUICK_REFERENCE.md                    # Referência rápida
```

### Arquivos Modificados

```
src/common/
├── config/
│   ├── api.ts                            # Adicionados interceptors
│   └── error-types.ts                    # Novos códigos de erro
├── services/
│   └── admin-login.ts                    # Novo endpoint
├── actions/
│   └── admin-login.tsx                   # Novos tipos
└── hooks/
    └── use-user-authentication.ts        # Cookies adicionais

src/interfaces/
└── admin.interface.ts                    # Re-exports dos novos tipos
```

---

## 🎯 Status da Migração

### ✅ Concluído
- Autenticação de admin
- Perfil de admin
- Gestão de tenants
- Sistema de permissões
- Interceptors de API
- Documentação completa

### 🔄 Em Andamento
- Migração de serviços de campanhas
- Migração de serviços de leads
- Atualização de componentes

### ⏳ Pendente
- Testes end-to-end
- Migração de brand analytics
- Atualização completa da UI

---

## 🔗 Links Importantes

- **API Swagger:** http://localhost:3002/api/docs
- **Frontend Dev:** http://localhost:3000
- **API Dev:** http://localhost:3002

---

## 💡 Dicas

1. **Sempre consulte o Swagger** antes de migrar um endpoint
2. **Teste cada serviço** antes de atualizar a UI
3. **Use o checklist** para não perder o progresso
4. **Mantenha a referência rápida** aberta durante o desenvolvimento
5. **Faça commits frequentes** após cada serviço migrado

---

## 🆘 Precisa de Ajuda?

1. Consulte a seção **Troubleshooting** em `QUICK_REFERENCE.md`
2. Verifique os exemplos em `MIGRATION_EXAMPLE.md`
3. Leia o manual completo em `manual-atualizacao-client-nextjs.md`
4. Consulte o Swagger da API

---

## 📝 Notas Importantes

- A API deve estar rodando em `localhost:3002` para testes
- Todos os headers de autenticação são injetados automaticamente
- Sessões expiradas (401) são tratadas automaticamente
- Multi-tenancy está disponível mas é opcional
- O sistema de permissões está pronto para uso

---

**Última atualização:** Fase 1 concluída - Autenticação implementada
**Próxima fase:** Migração de serviços de campanhas de email
