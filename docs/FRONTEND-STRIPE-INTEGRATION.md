# Integração Stripe — Guia para o Frontend do Cliente

> Este documento descreve como o frontend do cliente deve se integrar com o sistema de pagamentos via Stripe.

---

## Visão Geral

O frontend **não se comunica diretamente com o Stripe** para processar pagamentos. O fluxo é:

```
Frontend → Backend (ZARP API) → Stripe
```

O backend é quem tem a Secret Key e cria a sessão de checkout. O frontend só:
1. Chama o backend para obter a URL de checkout
2. Redireciona o usuário para essa URL
3. Recebe o usuário de volta após o pagamento

---

## O que você precisa

### Variável de ambiente

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
```

Essa chave é usada **apenas** para inicializar o Stripe.js no frontend (ex: exibir elementos de card customizados). Para o fluxo de checkout redirect, ela nem é obrigatória.

### Endpoint do backend

```
POST /api/subscriptions/checkout
```

---

## Fluxo de Assinatura

### 1. Usuário clica em "Assinar"

O frontend chama o backend passando o tenant e o plano desejado:

```typescript
const response = await fetch('/api/subscriptions/checkout', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`,
  },
  body: JSON.stringify({
    tenantId: 'id-do-tenant',
    priceId: 'price_1TPR2M0ogZDsblXetgfEwDfI', // price ID do plano escolhido
    successUrl: 'https://seusite.com/pagamento/sucesso',
    cancelUrl: 'https://seusite.com/pagamento/cancelado',
    trialPeriodDays: 7, // opcional, somente se o plano tiver trial
  }),
});

const { checkoutUrl } = await response.json();
```

### 2. Redirecionar para o Stripe

```typescript
window.location.href = checkoutUrl;
// O usuário é levado para checkout.stripe.com
// O Stripe cuida de todo o processo de pagamento
```

### 3. Receber o usuário de volta

Após o pagamento, o Stripe redireciona para a `successUrl` que você definiu.

Na página de sucesso, consulte o status da assinatura:

```typescript
// GET /api/subscriptions/tenant/:tenantId
const response = await fetch(`/api/subscriptions/tenant/${tenantId}`, {
  headers: { 'Authorization': `Bearer ${userToken}` },
});

const data = await response.json();
// data.subscription.status === 'active' → liberar acesso
// data.subscription === null → ainda sem assinatura
```

---

## Exemplo de Página de Planos

```tsx
// pages/planos.tsx

const PLANOS = [
  {
    nome: 'Mensal',
    priceId: 'price_xxx', // price ID do plano mensal no Stripe
    preco: 'R$ 99/mês',
  },
  {
    nome: 'Anual',
    priceId: 'price_1TPR2M0ogZDsblXetgfEwDfI', // price ID do plano anual
    preco: 'R$ 30/ano',
    destaque: true,
  },
];

function PaginaPlanos() {
  const handleAssinar = async (priceId: string) => {
    const res = await fetch('/api/subscriptions/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: SEU_TENANT_ID,
        priceId,
        successUrl: `${window.location.origin}/sucesso`,
        cancelUrl: `${window.location.origin}/planos`,
      }),
    });

    const { checkoutUrl } = await res.json();
    window.location.href = checkoutUrl;
  };

  return (
    <div>
      {PLANOS.map((plano) => (
        <div key={plano.priceId}>
          <h2>{plano.nome}</h2>
          <p>{plano.preco}</p>
          <button onClick={() => handleAssinar(plano.priceId)}>
            Assinar {plano.nome}
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Verificar Status da Assinatura

Use isso para proteger rotas ou exibir conteúdo premium:

```typescript
async function verificarAssinatura(tenantId: string) {
  const res = await fetch(`/api/subscriptions/tenant/${tenantId}`);
  const data = await res.json();

  if (!data.subscription) return 'sem_assinatura';

  const { status, isActive, isInTrial, daysRemaining } = data.subscription;

  if (isActive) return 'ativo';
  if (isInTrial) return 'trial';
  if (status === 'past_due') return 'pagamento_pendente';
  if (status === 'canceled') return 'cancelado';

  return 'inativo';
}
```

---

## Status possíveis da assinatura

| Status | Significado | O que fazer no frontend |
|--------|-------------|------------------------|
| `active` | Paga e ativa | Liberar acesso completo |
| `trialing` | Em período de teste | Liberar acesso + mostrar aviso de trial |
| `past_due` | Pagamento atrasado | Mostrar aviso + link para atualizar cartão |
| `canceled` | Cancelada | Bloquear acesso + oferecer reativação |
| `incomplete` | Checkout iniciado, sem pagamento | Redirecionar para checkout novamente |
| `unpaid` | Não paga após tentativas | Bloquear acesso |
| `paused` | Pausada | Bloquear acesso temporariamente |

---

## Cancelar Assinatura (pelo frontend do cliente)

```typescript
async function cancelarAssinatura(subscriptionId: string, imediato = false) {
  const res = await fetch(`/api/subscriptions/${subscriptionId}/cancel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cancelImmediately: imediato }),
  });

  const data = await res.json();
  // data.accessUntil → data até quando o acesso é mantido
  return data;
}
```

---

## Resumo do que o frontend precisa saber

| O que | Onde vem |
|-------|----------|
| `priceId` de cada plano | Hardcoded no frontend ou via API do backend |
| URL de checkout | Backend gera e retorna |
| Status da assinatura | Backend consulta e retorna |
| Publishable Key | `.env` do frontend (só se usar Stripe.js Elements) |

O frontend **nunca** lida com Secret Key, Webhook Secret ou dados de cartão diretamente.

---

*Última atualização: 23/04/2026*
