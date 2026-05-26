# Cupons — Guia de Integração Frontend (Admin Panel)

> Documento gerado em: 2026-05-10
> Backend: `backend_api_RESERVE-admin` branch `001-feat-coupons`
> Todos os valores monetários estão **em centavos** (integer).

---

## 1. Visão Geral

O módulo de cupons expõe dois grupos de rotas:

| Grupo | Prefixo | Autenticação | Rate-limit |
|---|---|---|---|
| Admin (CRUD) | `/admin/coupons` | Bearer JWT (`AdminJwtGuard`) | Nenhum |
| Público (validação UX) | `/public/coupons` | Nenhuma | 10 req/min por IP |

Todas as rotas exigem o header **`x-tenant-id`** com o ID do tenant.

---

## 2. Referência de Enums

### `EDiscountType`
| Valor | Descrição |
|---|---|
| `PERCENTAGE` | Desconto percentual (0–100) |
| `FIXED_AMOUNT` | Valor fixo em centavos |

### `ECouponScope`
| Valor | Descrição |
|---|---|
| `ORDER` | Aplica ao total do pedido |
| `PRODUCT` | Aplica apenas aos `productIds` listados |
| `CATEGORY` | Aplica apenas aos `categoryIds` listados |

### `ECouponAppliesTo`
| Valor | Descrição |
|---|---|
| `b2b` | Apenas clientes B2B |
| `b2c` | Apenas clientes B2C |
| `both` | Ambos |

---

## 3. Endpoints Admin

### Base URL
```
{API_BASE_URL}/admin/coupons
```

### Headers obrigatórios em todas as requests
```http
Authorization: Bearer {adminJwt}
x-tenant-id: {tenantId}
Content-Type: application/json
```

---

### 3.1 `GET /admin/coupons` — Listar cupons

**Query params**
| Param | Tipo | Default | Descrição |
|---|---|---|---|
| `page` | `number` | `1` | Página atual |
| `limit` | `number` | `20` | Itens por página |

**Response `200`**
```jsonc
{
  "data": [
    {
      "id": "clxyz123",
      "tenantId": "tenant_abc",
      "code": "PROMO10",
      "name": "10% de desconto",
      "description": "Válido até dezembro",
      "discountType": "PERCENTAGE",
      "discountValue": 10,
      "scope": "ORDER",
      "productIds": [],
      "categoryIds": [],
      "appliesTo": "both",
      "cumulative": false,
      "minOrderAmount": 5000,
      "maxDiscountAmount": null,
      "maxRedemptions": 100,
      "redeemedCount": 12,
      "expiresAt": "2026-12-31T23:59:59.000Z",
      "active": true,
      "createdAt": "2026-05-10T00:00:00.000Z",
      "updatedAt": "2026-05-10T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42
  }
}
```

---

### 3.2 `GET /admin/coupons/:id` — Buscar por ID

**Response `200`**: objeto único com o mesmo shape do item em 3.1.

**Response `404`**:
```json
{ "statusCode": 404, "message": "Cupom não encontrado" }
```

---

### 3.3 `POST /admin/coupons` — Criar cupom

**Request Body** (`CreateCouponDTO`)
```jsonc
{
  "code": "PROMO10",
  "name": "10% de desconto",
  "description": "Opcional",
  "discountType": "PERCENTAGE",
  "discountValue": 10,
  "scope": "ORDER",
  "productIds": [],
  "categoryIds": [],
  "appliesTo": "both",
  "cumulative": false,
  "minOrderAmount": 5000,
  "maxDiscountAmount": 10000,
  "maxRedemptions": 100,
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

**Campos obrigatórios**: `code`, `name`, `discountType`, `discountValue`, `scope`, `appliesTo`.

**Response `201`**: objeto criado (shape de 3.1).

**Response `409`**:
```json
{ "statusCode": 409, "message": "Cupom com código PROMO10 já existe" }
```

**Regras de validação importantes**:
- `code` é normalizado para uppercase automaticamente pelo backend.
- `discountValue` para `PERCENTAGE` deve estar entre 0 e 100 (validar no form do frontend).
- `productIds` deve ser preenchido quando `scope=PRODUCT`.
- `categoryIds` deve ser preenchido quando `scope=CATEGORY`.

---

### 3.4 `PUT /admin/coupons/:id` — Atualizar cupom

**Request Body** (`UpdateCouponDTO`) — todos os campos são opcionais:
```jsonc
{
  "name": "Novo nome",
  "description": "Nova descrição",
  "discountValue": 15,
  "productIds": ["prod_x"],
  "categoryIds": [],
  "appliesTo": "b2b",
  "cumulative": true,
  "minOrderAmount": null,
  "maxDiscountAmount": null,
  "maxRedemptions": null,
  "expiresAt": null,
  "active": false
}
```

> `code`, `discountType` e `scope` **não podem ser alterados** após a criação.

**Response `200`**: objeto atualizado.

---

### 3.5 `DELETE /admin/coupons/:id` — Desativar cupom (soft-delete)

**Response `200`**:
```json
{ "message": "Cupom desativado com sucesso" }
```

---

## 4. Endpoint Público

### 4.1 `POST /public/coupons/validate` — Validar cupom no carrinho

> Usado apenas para feedback de UX. O backend **recalcula** o desconto no checkout — nunca usar este valor para cobrar.

**Headers**:
```http
x-tenant-id: {tenantId}
Content-Type: application/json
```

**Request Body**
```jsonc
{
  "codes": ["PROMO10"],
  "cartItems": [
    {
      "productId": "prod_abc123",
      "categoryId": "cat_xyz456",
      "basePrice": 19900,
      "quantity": 2
    }
  ],
  "context": "b2b"
}
```

**Response `201`**
```jsonc
{
  "valid": true,
  "coupons": [
    {
      "code": "PROMO10",
      "discountAmount": 3980,
      "description": "10% de desconto (10%)"
    }
  ],
  "totalDiscount": 3980,
  "orderTotal": 39800,
  "finalTotal": 35820
}
```

**Response `422`** (cupom inválido/expirado/esgotado):
```json
{ "statusCode": 422, "message": "Cupom inválido: PROMO10" }
```

**Response `429`** (rate-limit — 10 req/min):
```json
{ "statusCode": 429, "message": "ThrottlerException: Too Many Requests" }
```

---

## 5. Integração no Checkout B2B

### `POST /b2b/payments/cart-checkout`
```jsonc
{
  "items": [{ "productId": "prod_abc", "quantity": 1 }],
  "leadName": "João Silva",
  "leadEmail": "joao@empresa.com",
  "leadPhone": "+5511999999999",
  "couponCodes": ["PROMO10"]
}
```

### `POST /b2b/payments/payment-link`
```jsonc
{
  "productId": "prod_abc",
  "customerEmail": "joao@empresa.com",
  "customerName": "João Silva",
  "customerPhone": "+5511999999999",
  "couponCodes": ["PROMO10"]
}
```

**Ciclo de vida no backend**:
1. Valida cupons via `ValidateCouponUseCase`.
2. Incrementa atomicamente `redeemedCount` (falha com `409` se esgotado).
3. Cria `Coupon` no Stripe com `amount_off` e passa `discounts: [{ coupon }]` na sessão.
4. `checkout.session.completed` → arquiva o Stripe coupon via `coupons.del()`.
5. `checkout.session.expired` → arquiva o Stripe coupon + decrementa `redeemedCount`.

---

## 6. Páginas do Painel Admin

### 6.1 `/admin/coupons` — Lista

**Componentes**:
- `CouponListPage` — container
- `CouponFiltersBar` — busca por código/nome + filtro `active`
- `CouponTable` com colunas:
  - Código — badge monospace
  - Nome
  - Desconto — `discountType` + `discountValue` (ex: "10%" ou "R$ 50,00")
  - Escopo — badge ORDER / PRODUCT / CATEGORY
  - Aplica a — badge B2B / B2C / AMBOS
  - Resgates — "12 / 100" ou "12 / ∞"
  - Expiração — data formatada ou "Sem expiração"
  - Status — badge ATIVO / INATIVO / EXPIRADO / ESGOTADO
  - Ações — Editar | Desativar | Ver detalhes
- `CouponPagination`
- Botão "Novo Cupom" → `/admin/coupons/new`

**Chamada**: `GET /admin/coupons?page=1&limit=20`

---

### 6.2 `/admin/coupons/new` — Criar Cupom

**Componente principal**: `CouponForm` (reutilizado por create e edit)

| Campo | Tipo de input | Notas |
|---|---|---|
| `code` | `text` uppercase | Validar duplicata no submit (409) |
| `name` | `text` | Obrigatório |
| `description` | `textarea` | Opcional |
| `discountType` | `select` | Muda label/mask do `discountValue` |
| `discountValue` | `number` | Se PERCENTAGE: 0–100; se FIXED_AMOUNT: centavos (usar máscara R$) |
| `scope` | `select` | Controla campos condicionais abaixo |
| `productIds` | `multiselect` | Visível só quando `scope=PRODUCT` |
| `categoryIds` | `multiselect` | Visível só quando `scope=CATEGORY` |
| `appliesTo` | `radio` ou `select` | B2B / B2C / AMBOS |
| `cumulative` | `checkbox` | Default: false |
| `minOrderAmount` | currency input | Centavos |
| `maxDiscountAmount` | currency input | Centavos |
| `maxRedemptions` | `number` | Vazio = ilimitado |
| `expiresAt` | `datetime-local` | ISO 8601 ao enviar |

**Submit**: `POST /admin/coupons`
**Redirect após sucesso**: `/admin/coupons/{id}`

---

### 6.3 `/admin/coupons/:id` — Detalhe e Edição

**Componentes**:
- `CouponSummaryCard` — todos os campos somente leitura
- `CouponStatsBar` — progress bar de resgates
- `CouponEditForm` — mesmo `CouponForm` com campos bloqueados: `code`, `discountType`, `scope`
- `CouponDeactivateButton` — `DELETE /admin/coupons/:id` com modal de confirmação

**Tooltip nos campos bloqueados**: "Não é possível alterar após a criação".

---

## 7. Componentes Compartilhados

### `CouponBadgeStatus`
```tsx
// Props: active, expiresAt, redeemedCount, maxRedemptions
// Estados: ATIVO | EXPIRADO | ESGOTADO | INATIVO
```

### `DiscountValueDisplay`
```tsx
// Props: discountType, discountValue
// Retorna: "10%" | "R$ 50,00"
```

### `CouponScopeDisplay`
```tsx
// Props: scope, productIds, categoryIds
// Retorna: "Todo o pedido" | "3 produtos" | "2 categorias"
```

### `CouponCodeInput` (checkout)
```tsx
// Input + botão "Aplicar"
// Chama: POST /public/coupons/validate
// Exibe: desconto aplicado, mensagem de erro, loading
// Após 429: botão bloqueado por 60s com contador regressivo
```

---

## 8. State Management

```ts
interface CouponStore {
  coupons: DiscountCoupon[];
  meta: { page: number; limit: number; total: number };
  isLoading: boolean;
  filters: { search: string; active: boolean | null };
  selectedCoupon: DiscountCoupon | null;
  isSaving: boolean;
  formErrors: Record<string, string>;
  appliedCoupons: CouponValidationResult | null;
  isValidating: boolean;
}
```

---

## 9. Tratamento de Erros

| Status | Cenário | Mensagem sugerida |
|---|---|---|
| `404` | Cupom não encontrado | "Cupom não encontrado" |
| `409` | Código duplicado | "Já existe um cupom com este código" |
| `409` | Cupom esgotado (checkout) | "Cupom esgotado — tente outro" |
| `422` | Inválido/expirado/esgotado (validate) | Usar `error.message` do backend |
| `429` | Rate-limit | "Muitas tentativas — aguarde 1 minuto" |

---

## 10. Tipos TypeScript

```ts
export type EDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type ECouponScope = 'ORDER' | 'PRODUCT' | 'CATEGORY';
export type ECouponAppliesTo = 'b2b' | 'b2c' | 'both';

export interface DiscountCoupon {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description: string | null;
  discountType: EDiscountType;
  discountValue: number;
  scope: ECouponScope;
  productIds: string[];
  categoryIds: string[];
  appliesTo: ECouponAppliesTo;
  cumulative: boolean;
  minOrderAmount: number | null;   // centavos
  maxDiscountAmount: number | null; // centavos
  maxRedemptions: number | null;
  redeemedCount: number;
  expiresAt: string | null; // ISO 8601
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponListResponse {
  data: DiscountCoupon[];
  meta: { page: number; limit: number; total: number };
}

export interface CreateCouponPayload {
  code: string;
  name: string;
  description?: string;
  discountType: EDiscountType;
  discountValue: number;
  scope: ECouponScope;
  productIds?: string[];
  categoryIds?: string[];
  appliesTo: ECouponAppliesTo;
  cumulative?: boolean;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  maxRedemptions?: number;
  expiresAt?: string;
}

export interface UpdateCouponPayload {
  name?: string;
  description?: string;
  discountValue?: number;
  productIds?: string[];
  categoryIds?: string[];
  appliesTo?: ECouponAppliesTo;
  cumulative?: boolean;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  maxRedemptions?: number | null;
  expiresAt?: string | null;
  active?: boolean;
}

export interface ValidateCouponPayload {
  codes: string[];
  cartItems: {
    productId: string;
    categoryId?: string;
    basePrice: number; // centavos
    quantity: number;
  }[];
  context: 'b2b' | 'b2c';
}

export interface CouponLineResult {
  code: string;
  discountAmount: number; // centavos
  description: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupons: CouponLineResult[];
  totalDiscount: number; // centavos
  orderTotal: number;   // centavos
  finalTotal: number;   // centavos
}
```

---

## 11. Decisões de UX

1. **Campo `code`**: CSS `text-transform: uppercase` + normalizar no submit. Mostrar como badge monospace na tabela.
2. **`discountValue`**: máscara de percentual (0–100%) quando `PERCENTAGE`; máscara de moeda em R$ (centavos) quando `FIXED_AMOUNT`.
3. **`minOrderAmount` e `maxDiscountAmount`**: sempre input de moeda (centavos), exibir em R$ na interface.
4. **`expiresAt`**: input `datetime-local`, converter para ISO 8601 antes de enviar.
5. **`maxRedemptions=null`**: exibir "Ilimitado". Nunca enviar `0`.
6. **Reativação de cupom**: usar `PUT /:id` com `{ active: true }` — o `DELETE` apenas desativa, nunca exclui.
7. **Botão "Aplicar Cupom" no checkout**: desabilitar enquanto vazio. Após `422`, exibir mensagem do backend. Após `429`, bloquear 60s com countdown visível.
8. **Cumulatividade**: ao adicionar um segundo cupom no checkout, o backend lança `422` se algum for não-cumulativo — tratar com mensagem clara ao usuário.
