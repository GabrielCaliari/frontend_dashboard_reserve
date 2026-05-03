# Guia de Uso - Sistema B2C

## Visão Geral

O sistema B2C permite gerenciar produtos educacionais e assinaturas de estudantes diretamente pelo dashboard administrativo. Os produtos são vendidos via Stripe e as assinaturas são gerenciadas automaticamente através de webhooks.

## Acessando as Funcionalidades

### 1. Produtos Educacionais

**Caminho**: Dashboard → Pagamentos → Produtos

Nesta página você encontrará:
- **Produtos B2C**: Seção dedicada aos produtos educacionais
- **Produtos do Painel**: Planos de assinatura para empresas (já existente)

#### O que você pode fazer:
- ✅ Visualizar todos os produtos ativos
- ✅ Ver preços (mensal, anual, etc)
- ✅ Verificar status (ativo/inativo)
- ✅ Acessar produto no Stripe Dashboard

### 2. Assinaturas B2C

**Caminho**: Dashboard → Pagamentos → Assinaturas B2C

Esta é a página principal para gerenciar assinaturas de estudantes.

#### Métricas Disponíveis:
- **Assinaturas Ativas**: Total de assinaturas ativas no momento
- **MRR**: Receita Mensal Recorrente em R$
- **Novos Assinantes**: Quantidade de novos assinantes no mês
- **Taxa de Churn**: Percentual de cancelamentos

#### Tabela de Assinaturas:
Exibe todas as assinaturas com:
- Email do estudante
- Produto assinado
- Status (Ativa, Teste, Cancelada, etc)
- Valor da assinatura
- Período de cobrança atual
- Ações disponíveis

#### Ações Disponíveis:
- **Ver no Stripe**: Abre a assinatura no Stripe Dashboard
- **Cancelar**: Cancela a assinatura (permanece ativa até o fim do período)

#### Top Produtos:
Card lateral mostrando os 5 produtos mais vendidos com quantidade de assinaturas.

## Fluxo de Trabalho

### Criando um Novo Produto

1. **No Stripe Dashboard**:
   - Acesse https://dashboard.stripe.com/products
   - Clique em "Create product"
   - Preencha nome, descrição e adicione imagens
   - Crie um ou mais preços (mensal, anual, etc)
   - Anote o `Product ID` (ex: `prod_xxxxx`) e `Price ID` (ex: `price_xxxxx`)

2. **Sincronizar no Banco de Dados**:
   Execute o SQL fornecido no documento `B2C-DASHBOARD-INTEGRATION.md` substituindo:
   - `prod_xxxxx` pelo Product ID do Stripe
   - `price_xxxxx` pelo Price ID do Stripe
   - Nome, descrição e slug do produto
   - Valor em centavos (ex: 9900 = R$ 99,00)

3. **Verificar no Dashboard**:
   - Acesse Dashboard → Pagamentos → Produtos
   - O novo produto deve aparecer na seção "Produtos Educacionais (B2C)"

### Monitorando Assinaturas

1. **Visualizar Todas as Assinaturas**:
   - Acesse Dashboard → Pagamentos → Assinaturas B2C
   - Veja a lista completa com status e valores

2. **Verificar Métricas**:
   - Os cards no topo mostram métricas em tempo real
   - MRR é calculado automaticamente
   - Taxa de churn é atualizada periodicamente

3. **Produtos Mais Vendidos**:
   - Card lateral mostra ranking de produtos
   - Útil para identificar produtos populares

### Cancelando uma Assinatura

1. Na tabela de assinaturas, localize a assinatura desejada
2. Clique no botão "Cancelar" (vermelho)
3. Confirme a ação no modal
4. A assinatura será marcada como "Cancela no fim"
5. O estudante terá acesso até o fim do período pago

**Importante**: O cancelamento não é imediato. O estudante mantém acesso até o fim do período de cobrança atual.

## Status das Assinaturas

| Status | Descrição | Cor |
|--------|-----------|-----|
| **Ativa** | Assinatura ativa e em dia | Verde |
| **Teste** | Período de teste (trial) | Amarelo |
| **Cancelada** | Assinatura cancelada | Cinza |
| **Atrasada** | Pagamento em atraso | Vermelho |
| **Não Paga** | Pagamento falhou | Vermelho |
| **Incompleta** | Checkout não finalizado | Amarelo |

## Webhooks do Stripe

O sistema depende de webhooks para manter as assinaturas sincronizadas. Certifique-se de que os seguintes eventos estão configurados:

- `checkout.session.completed` - Novo assinante
- `customer.subscription.updated` - Atualização de assinatura
- `customer.subscription.deleted` - Cancelamento
- `invoice.paid` - Pagamento confirmado
- `invoice.payment_failed` - Falha no pagamento

**URL do Webhook**: `https://api.seudominio.com/api/webhooks/b2c/stripe`

## Troubleshooting

### Produto não aparece na listagem
- Verifique se o produto está marcado como `active = true` no banco
- Confirme que há pelo menos um preço ativo associado
- Verifique se a API está retornando o produto corretamente

### Métricas não carregam
- Verifique se o endpoint `/api/subscriptions/b2c/metrics` está funcionando
- Confirme que há dados de assinaturas no banco
- Verifique logs do backend para erros

### Cancelamento não funciona
- Verifique se o endpoint de cancelamento está implementado
- Confirme que o `subscriptionId` está correto
- Verifique permissões do usuário no Stripe

### Assinatura não aparece após checkout
- Verifique se o webhook `checkout.session.completed` foi recebido
- Confirme que os metadados foram enviados corretamente no checkout
- Verifique logs do webhook no Stripe Dashboard

## Dicas de Uso

1. **Monitore o MRR regularmente** para acompanhar crescimento da receita
2. **Fique atento à taxa de churn** - valores acima de 5% podem indicar problemas
3. **Use o ranking de produtos** para identificar oportunidades de upsell
4. **Verifique assinaturas atrasadas** diariamente para tomar ações proativas
5. **Mantenha os produtos sincronizados** entre Stripe e banco de dados

## Próximas Funcionalidades

Funcionalidades planejadas para futuras versões:
- Filtros avançados na tabela de assinaturas
- Exportação de dados para Excel/CSV
- Gráficos de crescimento de MRR
- Notificações automáticas de eventos importantes
- Sistema de cupons de desconto
- Análise de cohort
- Relatórios personalizados

## Suporte

Para dúvidas ou problemas:
1. Consulte a documentação técnica em `B2C-DASHBOARD-INTEGRATION.md`
2. Verifique os logs da aplicação
3. Acesse o Stripe Dashboard para detalhes das transações
4. Entre em contato com o time de desenvolvimento
