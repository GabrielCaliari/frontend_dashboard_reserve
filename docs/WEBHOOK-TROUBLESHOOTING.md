# Troubleshooting: Subscription não aparece após checkout

## Problema
O checkout do Stripe é concluído com sucesso, mas a subscription não aparece no painel.

## Causa
O webhook do Stripe não está configurado ou não está sendo processado corretamente pelo backend.

---

## Diagnóstico Rápido

### 1. Verificar se o webhook está configurado no Stripe

**Acesse:** https://dashboard.stripe.com/test/webhooks

**Verifique:**
- ✅ Existe um webhook endpoint configurado?
- ✅ A URL aponta para o seu backend? (ex: `https://seu-backend.com/webhooks/stripe`)
- ✅ O webhook está **ativo** (não desabilitado)?
- ✅ Os eventos estão sendo enviados? (veja a aba "Logs")

**Eventos necessários:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### 2. Verificar se o webhook secret está configurado no backend

**No backend, verifique se existe:**
```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Como obter:**
1. Acesse o webhook no Stripe Dashboard
2. Clique em "Reveal" no campo "Signing secret"
3. Copie o valor (começa com `whsec_`)
4. Configure no `.env` do backend

### 3. Testar o webhook localmente (desenvolvimento)

**Opção A: Usar Stripe CLI**

```bash
# Instalar Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe
# Linux: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Encaminhar webhooks para localhost
stripe listen --forward-to localhost:3002/webhooks/stripe

# Em outro terminal, testar um evento
stripe trigger checkout.session.completed
```

**Opção B: Usar ngrok (expor localhost)**

```bash
# Instalar ngrok: https://ngrok.com/download

# Expor porta do backend
ngrok http 3002

# Copiar a URL gerada (ex: https://abc123.ngrok.io)
# Configurar no Stripe Dashboard: https://abc123.ngrok.io/webhooks/stripe
```

### 4. Verificar logs do backend

**Procure por:**
- ✅ Requisições chegando em `/webhooks/stripe`
- ✅ Eventos sendo processados (`checkout.session.completed`)
- ❌ Erros de validação de assinatura
- ❌ Erros ao salvar no banco de dados

**Exemplo de log esperado:**
```
[Webhook] Received event: checkout.session.completed
[Webhook] Session ID: cs_test_...
[Webhook] Creating subscription for tenant: xxx
[Webhook] Subscription created successfully
```

### 5. Verificar no banco de dados

**Consulta SQL para verificar subscriptions:**
```sql
SELECT * FROM subscriptions 
WHERE tenant_id = 'seu_tenant_id' 
ORDER BY created_at DESC 
LIMIT 5;
```

**Se não houver registros:**
- O webhook não está sendo processado
- Ou há erro ao salvar no banco

---

## Soluções Comuns

### Problema: Webhook não está configurado

**Solução:**
1. Acesse https://dashboard.stripe.com/test/webhooks
2. Clique em "Add endpoint"
3. URL: `https://seu-backend.com/webhooks/stripe`
4. Selecione os eventos listados acima
5. Copie o "Signing secret" e configure no backend

### Problema: Webhook secret incorreto

**Erro típico:**
```
Webhook signature verification failed
```

**Solução:**
1. Acesse o webhook no Stripe Dashboard
2. Clique em "Reveal" no Signing secret
3. Atualize `STRIPE_WEBHOOK_SECRET` no `.env` do backend
4. Reinicie o backend

### Problema: Webhook não chega ao backend (localhost)

**Solução:**
Use Stripe CLI ou ngrok (veja seção 3)

### Problema: Subscription criada no Stripe mas não no banco

**Possíveis causas:**
- Erro no código do webhook handler
- Tenant ID não encontrado
- Erro de validação de dados

**Solução:**
Verifique os logs do backend para ver o erro específico

---

## Teste Manual (Forçar criação da subscription)

Se o webhook não estiver funcionando, você pode testar manualmente:

### 1. Pegar o Subscription ID do Stripe

1. Acesse https://dashboard.stripe.com/test/subscriptions
2. Encontre a subscription criada
3. Copie o ID (começa com `sub_`)

### 2. Criar manualmente no banco (temporário)

```sql
INSERT INTO subscriptions (
  id,
  tenant_id,
  stripe_subscription_id,
  stripe_customer_id,
  stripe_price_id,
  status,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
) VALUES (
  'cuid_gerado',
  'seu_tenant_id',
  'sub_copiado_do_stripe',
  'cus_do_stripe',
  'price_do_plano',
  'active',
  NOW(),
  NOW() + INTERVAL '1 month',
  NOW(),
  NOW()
);
```

**⚠️ Isso é apenas para teste! Configure o webhook corretamente para produção.**

---

## Checklist Final

- [ ] Webhook configurado no Stripe Dashboard
- [ ] URL do webhook aponta para o backend correto
- [ ] Eventos necessários estão selecionados
- [ ] `STRIPE_WEBHOOK_SECRET` configurado no backend
- [ ] Backend está rodando e acessível
- [ ] Logs do backend mostram eventos chegando
- [ ] Subscription aparece no banco de dados
- [ ] Frontend busca e exibe a subscription

---

## Próximos Passos

1. **Verifique o webhook no Stripe Dashboard**
2. **Configure o webhook secret no backend**
3. **Teste com Stripe CLI ou ngrok**
4. **Monitore os logs do backend**
5. **Verifique o banco de dados**

Se após seguir todos os passos a subscription ainda não aparecer, compartilhe:
- Logs do backend ao processar o webhook
- Configuração do webhook no Stripe
- Resultado da consulta SQL no banco de dados
