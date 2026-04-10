import { useQuery } from "@tanstack/react-query";
import { paymentMovementsService } from "@/src/common/services/payments/payment-movements-service";
import { useHasSelectedTenant } from "@/src/shared/stores/tenant-store";
import type {
  PaymentMovement,
  MovementStatus,
} from "@/src/shared/domain/types/@payment-movements";

// Status que indicam carrinho abandonado ou lead que não fechou
const ABANDONED_STATUSES: MovementStatus[] = [
  "pending",
  "abandoned",
  "incomplete",
  "past_due",
];

export interface AbandonedCart {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  country?: string;
  gateway: string;
  products: { id: string; name: string; price: number }[];
  type: "subscription" | "one_time";
  status: MovementStatus;
  amount: number;
  currency: string;
  createdAt: string;
  stripeLink?: string | null;
  // Campos para remarketing
  emailSequence?: {
    step1: "sent" | "pending" | "failed";
    step2: "sent" | "pending" | "failed";
    step3: "sent" | "pending" | "failed";
  };
  smsStatus?: "sent" | "pending" | "failed";
}

function mapMovementToAbandonedCart(movement: PaymentMovement): AbandonedCart {
  return {
    id: movement.id,
    name: movement.customerName || movement.customerEmail.split("@")[0],
    email: movement.customerEmail,
    gateway: "Stripe",
    products: [
      {
        id: movement.productId || movement.id,
        name: movement.productName,
        price: movement.amount,
      },
    ],
    type: movement.type,
    status: movement.status,
    amount: movement.amount,
    currency: movement.currency,
    createdAt: movement.createdAt,
    stripeLink: movement.stripeLink,
    // Inicializa campos de remarketing como pending
    emailSequence: {
      step1: "pending",
      step2: "pending",
      step3: "pending",
    },
    smsStatus: "pending",
  };
}

export function useAbandonedCarts() {
  const hasTenant = useHasSelectedTenant();

  return useQuery({
    queryKey: ["abandoned-carts"],
    queryFn: async () => {
      // Busca todas as movimentações
      const response = await paymentMovementsService.listMovements({
        limit: 500,
      });

      // Filtra apenas os status que indicam abandono
      const abandonedMovements = response.data.filter((movement) =>
        ABANDONED_STATUSES.includes(movement.status),
      );

      // Mapeia para o formato de AbandonedCart
      const abandonedCarts = abandonedMovements.map(mapMovementToAbandonedCart);

      return abandonedCarts;
    },
    enabled: hasTenant,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}
