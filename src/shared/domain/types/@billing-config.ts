// Enhanced Billing Configuration Types

export type BillingMode =
  | "recurring_infinite" // Cobra infinitamente até cancelar (ex: Netflix)
  | "recurring_limited" // Cobra X vezes e para (ex: 12 parcelas)
  | "one_time_expiring"; // Paga 1x, acesso por X meses, depois expira

export type BillingInterval = "day" | "week" | "month" | "year";

export interface BillingConfiguration {
  mode: BillingMode;
  interval: BillingInterval;
  intervalCount: number; // Quantos intervalos (ex: 1 mês, 3 meses, 1 ano)

  // Para recurring_limited
  maxCharges?: number; // Número máximo de cobranças (ex: 12 para 12 parcelas)

  // Para one_time_expiring
  accessDuration?: number; // Duração do acesso em meses
  accessDurationUnit?: "day" | "month" | "year"; // Unidade da duração
}

export interface EnhancedProductPrice {
  id: string;
  stripePriceId: string;
  unitAmount: number;
  currency: string;
  active: boolean;

  // Configuração de billing
  billingConfig: BillingConfiguration;

  createdAt?: string;
  updatedAt?: string;
}

// Exemplos de uso:
//
// 1. Netflix-style (recorrente infinito):
// {
//   mode: 'recurring_infinite',
//   interval: 'month',
//   intervalCount: 1
// }
//
// 2. Parcelamento (12x):
// {
//   mode: 'recurring_limited',
//   interval: 'month',
//   intervalCount: 1,
//   maxCharges: 12
// }
//
// 3. Acesso anual com pagamento único:
// {
//   mode: 'one_time_expiring',
//   interval: 'month', // não usado para cobrança
//   intervalCount: 1,
//   accessDuration: 12,
//   accessDurationUnit: 'month'
// }
